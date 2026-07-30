import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { playCue } from "@/lib/audio/audio-manager";

export interface ChatMessage {
  id: string;
  roomCode: string;
  userId: string | null;
  displayName: string;
  body: string;
  kind: string;
  createdAt: string;
}

const bodySchema = z.string().trim().min(1).max(280);

interface ChatRow {
  id: string;
  room_code: string;
  user_id: string | null;
  display_name: string;
  body: string;
  kind: string;
  created_at: string;
}

function fromRow(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    roomCode: row.room_code,
    userId: row.user_id,
    displayName: row.display_name,
    body: row.body,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

export function useChat(roomCode: string) {
  const { user, profile, guestName, isGuest } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    seenIds.current = new Set();
    setMessages([]);
    if (!roomCode) return;

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_code", roomCode)
        .order("created_at", { ascending: true })
        .limit(100);
      if (cancelled || !data) return;
      const rows = (data as ChatRow[]).map(fromRow);
      rows.forEach((m) => seenIds.current.add(m.id));
      setMessages(rows);
    })();

    const channel = supabase
      .channel(`chat:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const row = payload.new as ChatRow;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          const message = fromRow(row);
          setMessages((prev) => [...prev, message].slice(-100));
          if (message.kind === "chat" && message.userId !== user?.id) {
            playCue("message");
          }
        },
      )
      .subscribe((status) => {
        if (!cancelled) setConnected(status === "SUBSCRIBED");
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomCode, user?.id]);

  const canSend = Boolean(user && !isGuest);
  const sendDisabledReason = canSend
    ? null
    : "Sign in with an account to chat — guests can watch but not send messages.";

  const send = useCallback(
    async (body: string) => {
      if (!canSend || !roomCode) return;
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) return;
      const displayName = profile?.username || guestName || "Player";
      setSending(true);
      try {
        await supabase.from("chat_messages").insert({
          room_code: roomCode,
          user_id: user?.id ?? null,
          display_name: displayName,
          body: parsed.data,
          kind: "chat",
        });
      } finally {
        setSending(false);
      }
    },
    [canSend, roomCode, profile?.username, guestName, user?.id],
  );

  return { messages, sending, send, connected, canSend, sendDisabledReason };
}

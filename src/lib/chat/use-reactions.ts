import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playCue } from "@/lib/audio/audio-manager";

export interface Reaction {
  id: string;
  playerId: string;
  emoji: string;
  at: number;
}

const LIFESPAN_MS = 2500;
const RATE_LIMIT_MS = 800;

export function useReactions(roomCode: string, selfId: string) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase.channel(`room:${roomCode}:reactions`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const reaction = payload as Reaction;
        setReactions((prev) => [...prev, reaction]);
        if (reaction.playerId !== selfId) playCue("reaction");
        const timeout = setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
          timeoutsRef.current.delete(reaction.id);
        }, LIFESPAN_MS);
        timeoutsRef.current.set(reaction.id, timeout);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, selfId]);

  const sendReaction = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastSentRef.current < RATE_LIMIT_MS) return;
      lastSentRef.current = now;

      const reaction: Reaction = {
        id: `${selfId}-${now}-${Math.random().toString(36).slice(2, 8)}`,
        playerId: selfId,
        emoji,
        at: now,
      };

      setReactions((prev) => [...prev, reaction]);
      playCue("reaction");
      const timeout = setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        timeoutsRef.current.delete(reaction.id);
      }, LIFESPAN_MS);
      timeoutsRef.current.set(reaction.id, timeout);

      channelRef.current?.send({
        type: "broadcast",
        event: "reaction",
        payload: reaction,
      });
    },
    [selfId],
  );

  return { reactions, sendReaction };
}

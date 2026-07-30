import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { CreateRoomInput, Player, RoomState } from "@/lib/game/types";
import { generateRoomCode, setMeId, setOnlineMode, setRoom } from "@/lib/game/room-store";

/**
 * Realtime room synchronisation.
 *
 * `rooms` + `room_players` are the source of truth for lobby state; every
 * client mirrors them into the existing local room store so no component
 * needed to change. Live match traffic (passes, timers, SHOW, results) rides
 * a broadcast channel with the host acting as the authority.
 */

export interface RoomRow {
  code: string;
  name: string;
  host_id: string;
  max_players: number;
  category_id: string;
  visibility: string;
  game_mode: string;
  status: string;
}

interface PlayerRow {
  user_id: string;
  display_name: string;
  is_host: boolean;
  is_ready: boolean;
  connection: string;
  seat: number;
  avatar_emoji: string;
}

function toRoomState(room: RoomRow, players: PlayerRow[]): RoomState {
  return {
    code: room.code,
    name: room.name,
    hostId: room.host_id,
    maxPlayers: room.max_players,
    categoryId: room.category_id,
    visibility: (room.visibility as RoomState["visibility"]) ?? "private",
    gameMode: (room.game_mode as RoomState["gameMode"]) ?? "classic",
    status: room.status === "in-game" ? "in-game" : "lobby",
    createdAt: Date.now(),
    players: [...players]
      .sort((a, b) => a.seat - b.seat)
      .map<Player>((p) => ({
        id: p.user_id,
        name: p.display_name,
        isHost: p.is_host,
        isReady: p.is_ready,
        connection: (p.connection as Player["connection"]) ?? "connected",
      })),
  };
}

async function fetchRoom(code: string) {
  const [{ data: room, error: roomError }, { data: players, error: playersError }] = await Promise.all([
    supabase.from("rooms").select("*").eq("code", code).maybeSingle(),
    supabase.from("room_players").select("*").eq("room_code", code),
  ]);
  if (roomError) throw roomError;
  if (playersError) throw playersError;
  if (!room) return null;
  return toRoomState(room as RoomRow, (players ?? []) as PlayerRow[]);
}

export async function createOnlineRoom(
  input: CreateRoomInput,
  user: { id: string; emoji?: string },
): Promise<RoomState> {
  const code = generateRoomCode();
  const { error } = await supabase.from("rooms").insert({
    code,
    name: input.roomName,
    host_id: user.id,
    max_players: input.maxPlayers,
    category_id: input.categoryId,
    visibility: input.visibility,
    game_mode: input.gameMode,
    status: "lobby",
  });
  if (error) throw error;

  const { error: playerError } = await supabase.from("room_players").insert({
    room_code: code,
    user_id: user.id,
    display_name: input.hostName,
    avatar_emoji: user.emoji ?? "🎲",
    is_host: true,
    is_ready: false,
    seat: 0,
  });
  if (playerError) throw playerError;

  setMeId(user.id);
  setOnlineMode(true);
  const state = await fetchRoom(code);
  if (state) setRoom(state);
  return state!;
}

export async function joinOnlineRoom(
  code: string,
  user: { id: string; name: string; emoji?: string },
): Promise<RoomState> {
  const normalized = code.toUpperCase();
  const { data: room, error } = await supabase.from("rooms").select("*").eq("code", normalized).maybeSingle();
  if (error) throw error;
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.status === "in-game") throw new Error("ROOM_LOCKED");

  const { data: existing } = await supabase
    .from("room_players")
    .select("user_id, seat")
    .eq("room_code", normalized);

  const seated = existing ?? [];
  const alreadyIn = seated.some((p) => p.user_id === user.id);
  if (!alreadyIn && seated.length >= room.max_players) throw new Error("ROOM_FULL");

  const seat = alreadyIn
    ? seated.find((p) => p.user_id === user.id)!.seat
    : Math.max(-1, ...seated.map((p) => p.seat)) + 1;

  const { error: upsertError } = await supabase.from("room_players").upsert(
    {
      room_code: normalized,
      user_id: user.id,
      display_name: user.name,
      avatar_emoji: user.emoji ?? "🎲",
      is_host: room.host_id === user.id,
      is_ready: false,
      connection: "connected",
      seat,
    },
    { onConflict: "room_code,user_id" },
  );
  if (upsertError) throw upsertError;

  setMeId(user.id);
  setOnlineMode(true);
  const state = await fetchRoom(normalized);
  if (state) setRoom(state);
  return state!;
}

export async function setOnlineReady(code: string, userId: string, ready: boolean) {
  await supabase.from("room_players").update({ is_ready: ready }).eq("room_code", code).eq("user_id", userId);
}

export async function updateOnlineRoom(code: string, patch: Partial<RoomRow>) {
  await supabase.from("rooms").update(patch).eq("code", code);
}

export async function setOnlineRoomStatus(code: string, status: "lobby" | "in-game") {
  await supabase.from("rooms").update({ status }).eq("code", code);
}

export async function leaveOnlineRoom(code: string, userId: string, isHost: boolean) {
  await supabase.from("room_players").delete().eq("room_code", code).eq("user_id", userId);
  if (isHost) {
    // Hand the room over to whoever is left; delete it when the table empties.
    const { data: rest } = await supabase
      .from("room_players")
      .select("user_id, seat")
      .eq("room_code", code)
      .order("seat", { ascending: true });
    const next = rest?.[0];
    if (next) {
      await supabase.from("rooms").update({ host_id: next.user_id }).eq("code", code);
      await supabase
        .from("room_players")
        .update({ is_host: true })
        .eq("room_code", code)
        .eq("user_id", next.user_id);
    } else {
      await supabase.from("rooms").delete().eq("code", code);
    }
  }
  setOnlineMode(false);
}

export type SyncStatus = "connecting" | "connected" | "reconnecting" | "offline";

/**
 * Keeps the local room store in sync with the backend and reports connection
 * health. Safe to mount when `enabled` is false (guest / offline play).
 */
export function useRoomSync(code: string | null, enabled: boolean) {
  const [status, setStatus] = useState<SyncStatus>(enabled ? "connecting" : "offline");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !code) {
      setStatus("offline");
      return;
    }

    let active = true;

    const refresh = async () => {
      try {
        const next = await fetchRoom(code);
        if (!active) return;
        if (next) setRoom(next);
      } catch {
        /* transient — realtime will retry */
      }
    };

    void refresh();

    const channel = supabase
      .channel(`room-sync:${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_code=eq.${code}` },
        () => void refresh(),
      )
      .subscribe((s) => {
        if (!active) return;
        if (s === "SUBSCRIBED") setStatus("connected");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("reconnecting");
        else if (s === "CLOSED") setStatus("reconnecting");
      });

    channelRef.current = channel;

    // Heartbeat so other clients can spot a dropped player.
    const heartbeat = setInterval(() => {
      void refresh();
    }, 20000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code, enabled]);

  return status;
}

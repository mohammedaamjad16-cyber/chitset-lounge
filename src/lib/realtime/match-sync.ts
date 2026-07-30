import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  applyMatchSnapshot,
  callShow,
  getMatchSnapshot,
  getMatchTransport,
  passChit,
  setMatchTransport,
  type MatchState,
} from "@/lib/game/match-store";

/**
 * Live match traffic. The host runs the authoritative engine and broadcasts
 * snapshots; guests render those snapshots and send intents back.
 */

type Payload =
  | { type: "state"; state: MatchState | null }
  | { type: "pass"; playerId: string; chitId: string }
  | { type: "show"; playerId: string }
  | { type: "sync-request" };

let channel: RealtimeChannel | null = null;

function send(payload: Payload) {
  void channel?.send({ type: "broadcast", event: "match", payload });
}

export function useMatchSync(roomCode: string | null, isHost: boolean, enabled: boolean) {
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  useEffect(() => {
    if (!enabled || !roomCode) {
      setMatchTransport(null);
      return;
    }

    const ch = supabase.channel(`room:${roomCode}:match`, {
      config: { broadcast: { self: false } },
    });

    ch.on("broadcast", { event: "match" }, ({ payload }) => {
      const data = payload as Payload;
      if (isHostRef.current) {
        if (data.type === "pass") passChit(data.playerId, data.chitId);
        else if (data.type === "show") callShow(data.playerId);
        else if (data.type === "sync-request") {
          send({ type: "state", state: getMatchSnapshot() });
        }
      } else if (data.type === "state") {
        applyMatchSnapshot(data.state);
      }
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED" && !isHostRef.current) send({ type: "sync-request" });
    });

    channel = ch;
    setMatchTransport({
      isHost,
      broadcast: (state) => send({ type: "state", state }),
    });

    return () => {
      setMatchTransport(null);
      supabase.removeChannel(ch);
      channel = null;
    };
  }, [roomCode, enabled, isHost]);
}

/** Pass a chit — routed through the host when playing online as a guest. */
export function netPassChit(playerId: string, chitId: string) {
  const transport = getMatchTransport();
  if (transport && !transport.isHost) send({ type: "pass", playerId, chitId });
  else passChit(playerId, chitId);
}

/** Call SHOW — the host validates in every mode. */
export function netCallShow(playerId: string): { ok: boolean; reason?: string; pending?: boolean } {
  const transport = getMatchTransport();
  if (transport && !transport.isHost) {
    send({ type: "show", playerId });
    return { ok: true, pending: true };
  }
  return callShow(playerId);
}

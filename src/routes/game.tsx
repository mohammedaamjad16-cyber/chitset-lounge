import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, LogOut, ShieldAlert, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, emptyStatePresets } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { GameTable } from "@/components/game/game-table";
import { PlayerHand } from "@/components/game/player-hand";
import { ResultsScreen } from "@/components/game/results-screen";
import { getCategory } from "@/lib/game/categories";
import { addHistoryEntry } from "@/lib/game/history";
import { recordMatchResult } from "@/lib/game/progression";
import { useGameSound } from "@/hooks/use-game-sound";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { getMeId, isOnlineMode, useRoom } from "@/lib/game/room-store";
import { setOnlineRoomStatus } from "@/lib/realtime/room-sync";
import { netCallShow, netPassChit, useMatchSync } from "@/lib/realtime/match-sync";
import { ChatSheet } from "@/components/chat/chat-sheet";
import { ReactionBar } from "@/components/chat/reaction-bar";
import { useReactions } from "@/lib/chat/use-reactions";
import {
  clearInvalidShow,
  endMatch,
  revealChit,
  startMatch,
  useMatch,
} from "@/lib/game/match-store";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Game Table — ChitSet" },
      {
        name: "description",
        content:
          "Play a live ChitSet match: unfold your chits, pass clockwise before the timer runs out and call Show with four matching chits.",
      },
      { property: "og:title", content: "ChitSet Game Table" },
      { property: "og:description", content: "Pass chits clockwise and call Show to win." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameRoute,
});

function GameRoute() {
  const room = useRoom();
  const match = useMatch();
  const navigate = useNavigate();
  const { play } = useGameSound();

  const [meId, setMeId] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const savedRef = useRef<string | null>(null);
  const [online, setOnline] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const prevTurnId = useRef<string | null>(null);
  const prevPassAt = useRef<number>(0);
  const isHost = !!room && !!meId && room.hostId === meId;
  useMatchSync(room?.code ?? null, isHost, online);
  const { reactions, sendReaction } = useReactions(online ? (room?.code ?? "") : "", meId ?? "");

  useEffect(() => {
    setMeId(getMeId());
    setOnline(isOnlineMode());
    const t = setTimeout(() => setHydrating(false), 250);
    return () => clearTimeout(t);
  }, []);

  // Start a match automatically when arriving from the lobby.
  useEffect(() => {
    if (hydrating || match || !room) return;
    if (isOnlineMode() && room.hostId !== getMeId()) return; // guests wait for the host snapshot
    startMatch(room, getMeId());
  }, [hydrating, match, room]);

  // Invalid SHOW feedback — shake the hand and buzz once.
  useEffect(() => {
    if (!match?.invalidShowAt) return;
    play("invalidShow");
    setShakeKey((k) => k + 1);
    clearInvalidShow();
  }, [match?.invalidShowAt, play]);

  // Ambient cues for pass + turn changes (works for bots and remote players too).
  useEffect(() => {
    const at = match?.pass?.at ?? 0;
    if (at && at !== prevPassAt.current) {
      prevPassAt.current = at;
      play(match?.pass?.toId === meId ? "receive" : "pass");
    }
  }, [match?.pass?.at, match?.pass?.toId, meId, play]);

  // Hands are face-up: any chit that reaches this player folded (a fresh
  // arrival, or a restored older match) flips itself open after a short settle.
  const myFoldedIds = (match?.hands[meId ?? ""] ?? [])
    .filter((c) => !match?.revealed[c.id])
    .map((c) => c.id)
    .join(",");
  useEffect(() => {
    if (!myFoldedIds || !match || match.phase === "finished") return;
    const ids = myFoldedIds.split(",");
    const t = setTimeout(() => {
      play("flip");
      ids.forEach((id) => revealChit(id));
    }, 450);
    return () => clearTimeout(t);
  }, [myFoldedIds, match?.phase, play, match]);

  useEffect(() => {
    if (!match || match.phase !== "playing") return;
    const activeId = match.players[match.turnIndex]?.id ?? null;
    if (activeId && activeId !== prevTurnId.current) {
      prevTurnId.current = activeId;
      if (activeId === meId) play("turnStart");
    }
  }, [match, meId, play]);

  // Persist the finished match once.
  useEffect(() => {
    if (!match || match.phase !== "finished" || !match.winnerId) return;
    const key = `${match.roomCode}-${match.startedAt}`;
    if (savedRef.current === key) return;
    savedRef.current = key;
    // Full fanfare for your own win; a softer wrap-up when someone else takes it.
    play(match.winnerId === meId ? "winner" : "matchEnd");
    addHistoryEntry({
      id: key,
      winnerName: match.players.find((p) => p.id === match.winnerId)?.name ?? "Player",
      categoryName: getCategory(match.categoryId)?.name ?? "Category",
      winningLabel: match.winningChits[0]?.label ?? "—",
      players: match.players.map((p) => p.name),
      durationMs: (match.endedAt ?? Date.now()) - match.startedAt,
      turns: match.turns,
      playedAt: Date.now(),
    });
    void recordMatchResult({
      roomCode: match.roomCode,
      categoryId: match.categoryId,
      winnerName: match.players.find((p) => p.id === match.winnerId)?.name ?? "Player",
      winnerIsMe: match.winnerId === getMeId(),
      winningLabel: match.winningChits[0]?.label ?? "—",
      players: match.players.map((p) => p.name),
      durationMs: (match.endedAt ?? Date.now()) - match.startedAt,
      turns: match.turns,
    }).then((outcome) => {
      if (!outcome) return;
      if (outcome.xpAwarded) notify.success(`+${outcome.xpAwarded} XP`, outcome.newLevel ? `Level ${outcome.newLevel} reached!` : undefined);
      outcome.unlocked.forEach((code) => notify.success("Achievement unlocked", code.replace(/_/g, " ")));
    });
  }, [match, meId, play]);

  if (hydrating) {
    return <DealingScreen label="Setting the table..." />;
  }

  if (!room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <EmptyState
          {...emptyStatePresets.roomNotFound}
          actionLabel="Create a room"
          onAction={() => navigate({ to: "/create-room" })}
        />
      </div>
    );
  }

  if (!match) return <DealingScreen label="Shuffling the chits..." />;

  const category = getCategory(match.categoryId);
  const categoryName = category?.name ?? "Category";
  const me = match.players.find((p) => p.id === meId) ?? match.players[0];
  const myHand = match.hands[me?.id ?? ""] ?? [];
  const activePlayer = match.players[match.turnIndex];
  const isMyTurn = activePlayer?.id === me?.id;
  const canAct = match.phase === "playing";

  if (match.phase === "dealing") return <DealingScreen label="Distributing chits..." />;

  if (match.phase === "finished") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ResultsScreen
          match={match}
          categoryName={categoryName}
          meId={me?.id ?? null}
          onPlayAgain={() => {
            play("click");
            if (online && !isHost) {
              notify.info("Waiting for the host", "Only the host can deal a new match.");
              return;
            }
            startMatch(room, meId);
            setSelected(null);
            notify.success("New match", "Fresh chits are on the table.");
          }}
          onBackToLobby={() => {
            if (online && isHost) void setOnlineRoomStatus(room.code, "lobby");
            endMatch();
            navigate({ to: "/lobby" });
          }}
        />
      </div>
    );
  }

  const handlePass = () => {
    if (!selected || !me) return;
    play("pass");
    netPassChit(me.id, selected);
    setSelected(null);
  };

  const handleShow = () => {
    if (!me) return;
    const result = netCallShow(me.id);
    if (result.pending) return;
    if (result.ok) {
      // Distinct from the winner fanfare — this is the moment of the claim.
      play("show");
    } else {
      play("error");
      notify.error("Invalid Show", result.reason ?? "Keep playing.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <GlassCard className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:flex sm:flex-wrap sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold sm:text-xl">{match.roomName}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {match.roomCode} · {categoryName} · {match.turns} passes
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={isMyTurn ? "default" : "secondary"} className="text-[11px]">
              {isMyTurn ? "Your turn" : `${activePlayer?.name ?? "Player"}'s turn`}
            </Badge>
            {online && meId && <ChatSheet roomCode={room.code} selfId={meId} />}
            <Button variant="outline" size="sm" onClick={() => setLeaveOpen(true)}>
              <LogOut className="mr-1.5 h-4 w-4" /> Leave
            </Button>
          </div>
        </GlassCard>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <GlassCard className="p-4 sm:p-6">
            <GameTable
              match={match}
              meId={me?.id ?? null}
              categoryName={categoryName}
              categoryEmoji={category?.emoji}
              reactions={online ? reactions : undefined}
            />
            {online && <ReactionBar onSend={sendReaction} className="mt-4" />}
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-5">
              <h2 className="font-display text-sm font-semibold">Match log</h2>
              <ul className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {match.log.slice(0, 6).map((entry) => (
                    <motion.li
                      key={entry.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-muted-foreground"
                    >
                      {entry.text}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-primary" /> How to win
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Collect four identical chits, then call Show on your turn. An invalid Show is rejected
                and the match continues.
              </p>
            </GlassCard>
          </div>
        </div>

        <GlassCard className="p-5 sm:p-6">
          <PlayerHand
            hand={myHand}
            revealed={match.revealed}
            selectedId={selected}
            isMyTurn={isMyTurn}
            canAct={canAct}
            shakeKey={shakeKey}
            onSelect={(id) => {
              play("chitSelect");
              setSelected((prev) => (prev === id ? null : id));
            }}
            onReveal={(id) => {
              play("flip");
              revealChit(id);
            }}
            onPass={handlePass}
            onShow={handleShow}
          />
        </GlassCard>
      </motion.div>

      <ConfirmModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave the match?"
        description="The match ends for you and you'll return to the lobby."
        confirmLabel="Leave Match"
        destructive
        onConfirm={() => {
          if (online && isHost) void setOnlineRoomStatus(room.code, "lobby");
          endMatch();
          notify.info("You left the match");
          navigate({ to: "/lobby" });
        }}
      />
    </div>
  );
}

function DealingScreen({ label }: { label: string }) {
  const reduced = useReducedMotionPref();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4" role="status" aria-live="polite">
      <div className="relative grid h-24 w-24 place-items-center">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute h-14 w-10 rounded-xl border border-border/70 bg-gradient-primary shadow-glow"
            initial={reduced ? { opacity: 0 } : { rotate: 0, y: 0, opacity: 0.6 }}
            animate={
              reduced
                ? { opacity: 1 }
                : { rotate: [0, (i - 1.5) * 22, 0], y: [0, -8, 0], opacity: 1 }
            }
            transition={reduced ? { duration: 0.2 } : { duration: 1.6, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
          />
        ))}
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </p>
    </div>
  );
}

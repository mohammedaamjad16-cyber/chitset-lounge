import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, RotateCcw, Trophy, Users, Repeat, Home } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChitCard } from "./chit-card";
import { formatDuration } from "@/lib/game/engine";
import type { MatchState } from "@/lib/game/match-store";
import { readHistory } from "@/lib/game/history";

interface ResultsScreenProps {
  match: MatchState;
  categoryName: string;
  meId: string | null;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 1.6,
        rotate: Math.random() * 360,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 h-2.5 w-1.5 rounded-[2px] bg-gradient-primary"
          style={{ left: `${p.left}%` }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: 420, opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function ResultsScreen({
  match,
  categoryName,
  meId,
  onPlayAgain,
  onBackToLobby,
}: ResultsScreenProps) {
  const winner = match.players.find((p) => p.id === match.winnerId);
  const duration = (match.endedAt ?? Date.now()) - match.startedAt;
  const history = useMemo(() => readHistory().slice(0, 4), []);
  const iWon = winner?.id === meId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-3xl space-y-6"
    >
      <GlassCard className="relative overflow-hidden p-6 text-center sm:p-10">
        <Confetti />
        <motion.div
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-glow"
        >
          <Trophy className="h-7 w-7" />
        </motion.div>

        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {iWon ? "You win!" : `${winner?.name ?? "Someone"} wins!`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four matching {match.winningChits[0]?.label ?? "chits"} in the {categoryName} round.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {match.winningChits.map((chit) => (
            <ChitCard key={chit.id} chit={chit} revealed size="sm" disabled />
          ))}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Stat icon={Clock} label="Duration" value={formatDuration(duration)} />
          <Stat icon={Repeat} label="Total turns" value={String(match.turns)} />
          <Stat icon={Users} label="Players" value={String(match.players.length)} />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {match.players.map((p) => (
            <Badge key={p.id} variant={p.id === match.winnerId ? "default" : "secondary"} className="text-[11px]">
              {p.id === match.winnerId ? "🏆 " : ""}
              {p.name}
            </Badge>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            className="min-h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            onClick={onPlayAgain}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Play Again
          </Button>
          <Button variant="outline" className="min-h-11" onClick={onBackToLobby}>
            <Home className="mr-1.5 h-4 w-4" /> Return to Lobby
          </Button>
        </div>
      </GlassCard>

      {history.length > 0 && (
        <GlassCard className="p-5">
          <h2 className="font-display text-sm font-semibold">Recent matches</h2>
          <ul className="mt-3 space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium">🏆 {h.winnerName}</span>
                <span className="text-muted-foreground">
                  {h.categoryName} · {h.winningLabel} · {formatDuration(h.durationMs)} · {h.turns} turns
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-3">
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

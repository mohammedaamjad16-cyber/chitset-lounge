import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { History, Trophy, Users, Clock, Swords, PlusCircle } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/shared/loaders";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useRecentMatches } from "@/lib/profile/queries";
import { readHistory, type MatchHistoryEntry } from "@/lib/game/history";
import { getCategory } from "@/lib/game/categories";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Match History — ChitSet" },
      { name: "description", content: "Review your recent ChitSet matches, wins, and XP earned." },
      { property: "og:title", content: "ChitSet Match History" },
      { property: "og:description", content: "Review your recent matches, wins, and XP earned." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function SummaryStrip({ played, wins }: { played: number; wins: number }) {
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
  const items = [
    { label: "Matches Played", value: played },
    { label: "Wins", value: wins },
    { label: "Win Rate", value: `${winRate}%` },
  ];
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <GlassCard key={item.label} className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{item.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="p-10 text-center">
      <Swords className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">No matches yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Start a room and play your first match to see it here.</p>
      <Button asChild className="mt-5 min-h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
        <Link to="/create-room">
          <PlusCircle className="mr-1.5 h-4 w-4" /> Create a Room
        </Link>
      </Button>
    </GlassCard>
  );
}

function HistoryPage() {
  const { user, isGuest } = useAuth();
  const cloudQuery = useRecentMatches(isGuest ? null : user?.id, 25);
  const localHistory = useMemo(() => (isGuest ? readHistory() : []), [isGuest]);

  const isLoading = !isGuest && cloudQuery.isLoading;
  const cloudMatches = cloudQuery.data ?? [];

  const played = isGuest ? localHistory.length : cloudMatches.length;
  const wins = isGuest
    ? localHistory.filter((h) => h.winnerName).length // local entries don't track "me" reliably; count all as played
    : cloudMatches.filter((m) => m.is_winner).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-accent text-primary-foreground shadow-glow">
            <History className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Match History</h1>
          <p className="mt-2 text-muted-foreground">
            {isGuest ? "Stored on this device — sign in to sync across devices." : "Your recent matches, synced to your account."}
          </p>
        </div>

        {!isGuest && !isLoading && <SummaryStrip played={played} wins={wins} />}

        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : isGuest ? (
          localHistory.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {localHistory.map((entry) => (
                <LocalMatchRow key={entry.id} entry={entry} />
              ))}
            </div>
          )
        ) : cloudMatches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {cloudMatches.map((row) => (
              <CloudMatchRow key={row.match_id} row={row} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function LocalMatchRow({ entry }: { entry: MatchHistoryEntry }) {
  const category = getCategory(entry.categoryName.toLowerCase());
  const Icon = category?.icon ?? Swords;
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          <Trophy className="mr-1 inline h-3.5 w-3.5 text-warning" />
          {entry.winnerName} won with {entry.winningLabel}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {entry.players.length} players
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(Math.round(entry.durationMs / 1000))}
          </span>
          <span>{entry.turns} turns</span>
          <span>{formatDistanceToNow(new Date(entry.playedAt), { addSuffix: true })}</span>
        </p>
      </div>
    </GlassCard>
  );
}

type CloudMatchRowData = {
  match_id: string;
  is_winner: boolean;
  xp_awarded: number;
  matches: {
    category_id: string;
    winner_name: string;
    winning_label: string | null;
    player_count: number;
    duration_seconds: number;
    turns: number;
    created_at: string;
    players: unknown;
  } | null;
};

function CloudMatchRow({ row }: { row: CloudMatchRowData }) {
  const match = row.matches;
  if (!match) return null;
  const category = getCategory(match.category_id);
  const Icon = category?.icon ?? Swords;
  const players = Array.isArray(match.players) ? (match.players as string[]) : [];

  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {match.winner_name} won{match.winning_label ? ` with ${match.winning_label}` : ""}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              row.is_winner ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {row.is_winner ? "Won" : "Lost"}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{category?.name ?? match.category_id}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {players.length || match.player_count}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(match.duration_seconds)}
          </span>
          <span>{match.turns} turns</span>
          <span>+{row.xp_awarded} XP</span>
          <span>{formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}</span>
        </p>
      </div>
    </GlassCard>
  );
}

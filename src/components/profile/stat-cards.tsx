import { motion } from "framer-motion";
import { Swords, Trophy, Percent, Flame, Crown, Timer, Clock, Star } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import type { StatsRow } from "@/lib/profile/queries";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatPlayTime(seconds: number | null | undefined) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function StatCards({ stats }: { stats: StatsRow | null | undefined }) {
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalMatches = stats?.total_matches ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const tiles = [
    { label: "Matches Played", value: totalMatches, icon: Swords },
    { label: "Wins", value: wins, icon: Trophy },
    { label: "Win Rate", value: `${winRate}%`, icon: Percent },
    { label: "Current Streak", value: stats?.current_streak ?? 0, icon: Flame },
    { label: "Longest Streak", value: stats?.longest_streak ?? 0, icon: Crown },
    { label: "Fastest Win", value: formatDuration(stats?.fastest_win_seconds), icon: Timer },
    { label: "Total Play Time", value: formatPlayTime(stats?.total_play_seconds), icon: Clock },
    { label: "Favourite Category", value: stats?.favorite_category ?? "—", icon: Star },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <GlassCard className="flex h-full flex-col gap-2 p-4">
            <tile.icon className="h-5 w-5 text-primary" />
            <div className="text-xl font-bold tracking-tight">{tile.value}</div>
            <div className="text-xs text-muted-foreground">{tile.label}</div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

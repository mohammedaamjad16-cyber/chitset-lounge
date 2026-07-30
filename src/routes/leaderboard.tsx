import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Star, Crown, Medal } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { CardSkeleton } from "@/components/shared/loaders";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useLeaderboard, type LeaderboardScope } from "@/lib/profile/queries";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — ChitSet" },
      { name: "description", content: "See who tops the ChitSet leaderboard by XP, wins, and win streaks." },
      { property: "og:title", content: "ChitSet Leaderboard" },
      { property: "og:description", content: "Global rankings by XP, wins, and streaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

const TABS: { scope: LeaderboardScope; label: string; icon: typeof Trophy; unit: string }[] = [
  { scope: "xp", label: "Top XP", icon: Star, unit: "XP" },
  { scope: "wins", label: "Most Wins", icon: Trophy, unit: "wins" },
  { scope: "streak", label: "Best Streak", icon: Flame, unit: "streak" },
];

const PODIUM_STYLES = [
  { order: "sm:order-2", height: "sm:h-40", ring: "ring-warning/60", medal: "text-warning" },
  { order: "sm:order-1", height: "sm:h-32", ring: "ring-muted-foreground/40", medal: "text-muted-foreground" },
  { order: "sm:order-3", height: "sm:h-28", ring: "ring-accent/50", medal: "text-accent" },
];

function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>("xp");
  const { user } = useAuth();
  const { data, isLoading } = useLeaderboard(scope);
  const activeTab = TABS.find((t) => t.scope === scope)!;

  const top3 = useMemo(() => (data ?? []).slice(0, 3), [data]);
  const rest = useMemo(() => (data ?? []).slice(3), [data]);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Leaderboard</h1>
          <p className="mt-2 text-muted-foreground">See how you stack up against the rest of ChitSet.</p>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.scope === scope;
            return (
              <button
                key={tab.scope}
                type="button"
                onClick={() => setScope(tab.scope)}
                className={cn(
                  "flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : !data || data.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No rankings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Play a few matches to appear on the leaderboard.</p>
          </GlassCard>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-center">
                {podiumOrder.map((entry, i) => {
                  if (!entry) return null;
                  const rank = top3.indexOf(entry) + 1;
                  const style = PODIUM_STYLES[rank - 1];
                  const isMe = entry.id === user?.id;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.08 }}
                      className={cn("flex-1 sm:max-w-[180px]", style.order)}
                    >
                      <GlassCard
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-4 text-center ring-2",
                          style.height,
                          style.ring,
                          isMe && "outline outline-2 outline-primary",
                        )}
                      >
                        <Medal className={cn("h-5 w-5", style.medal)} />
                        <span className="text-2xl">{entry.avatar_emoji}</span>
                        <p className="max-w-full truncate text-sm font-semibold">{entry.username}</p>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          Lvl {entry.level}
                        </span>
                        <p className="text-lg font-bold text-primary">
                          {entry.value} <span className="text-xs font-normal text-muted-foreground">{activeTab.unit}</span>
                        </p>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {rest.length > 0 && (
              <GlassCard className="divide-y divide-border p-2 sm:p-3">
                {rest.map((entry, idx) => {
                  const rank = idx + 4;
                  const isMe = entry.id === user?.id;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5",
                        isMe && "bg-primary/10 ring-1 ring-primary/40",
                      )}
                    >
                      <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">{rank}</span>
                      <span className="text-xl">{entry.avatar_emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {entry.username}
                          {isMe && <span className="ml-1.5 text-xs text-primary">(you)</span>}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        Lvl {entry.level}
                      </span>
                      <span className="w-16 shrink-0 text-right text-sm font-semibold">
                        {entry.value} <span className="text-xs font-normal text-muted-foreground">{activeTab.unit}</span>
                      </span>
                    </div>
                  );
                })}
              </GlassCard>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

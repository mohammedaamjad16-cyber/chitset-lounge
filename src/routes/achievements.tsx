import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Flame,
  Crown,
  Zap,
  Award,
  Target,
  Shield,
  Swords,
  Gem,
  Rocket,
  Medal,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { useAchievements, useUnlockedAchievements } from "@/lib/profile/queries";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — ChitSet" },
      { name: "description", content: "Browse every ChitSet achievement and track which ones you've unlocked." },
      { property: "og:title", content: "ChitSet Achievements" },
      { property: "og:description", content: "See every unlockable achievement and your progress toward them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AchievementsPage,
});

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  crown: Crown,
  zap: Zap,
  award: Award,
  target: Target,
  shield: Shield,
  swords: Swords,
  gem: Gem,
  rocket: Rocket,
  medal: Medal,
};

function resolveIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Trophy;
  return ICON_MAP[icon.toLowerCase()] ?? Trophy;
}

const TIER_STYLES: Record<string, string> = {
  bronze: "border-transparent bg-amber-700/20 text-amber-600",
  silver: "border-transparent bg-slate-400/20 text-slate-500",
  gold: "border-transparent bg-yellow-400/20 text-yellow-600",
  platinum: "border-transparent bg-cyan-400/20 text-cyan-600",
};

function AchievementsPage() {
  const { user } = useAuth();
  const { data: achievements, isLoading } = useAchievements();
  const { data: unlocked } = useUnlockedAchievements(user?.id);
  const unlockedCodes = new Set((unlocked ?? []).map((u) => u.code));
  const total = achievements?.length ?? 0;
  const unlockedCount = achievements ? achievements.filter((a) => unlockedCodes.has(a.code)).length : 0;

  return (
    <Section>
      <SectionHeader
        eyebrow="Achievements"
        title="Every milestone worth chasing"
        description={
          user
            ? `${unlockedCount} of ${total} unlocked`
            : "Sign in to track your progress toward these achievements."
        }
      />

      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Loading achievements…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(achievements ?? []).map((a, i) => {
            const Icon = resolveIcon(a.icon);
            const isUnlocked = unlockedCodes.has(a.code);
            return (
              <motion.div
                key={a.code}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 6) * 0.05 }}
              >
                <GlassCard
                  className={cn(
                    "flex h-full flex-col gap-3 p-5 transition",
                    !isUnlocked && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        isUnlocked ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge className={cn("capitalize", TIER_STYLES[a.tier?.toLowerCase()] ?? "")}>{a.tier}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                  </div>
                  {!isUnlocked && <span className="mt-auto text-xs font-medium uppercase tracking-wide text-muted-foreground">Locked</span>}
                  {isUnlocked && <span className="mt-auto text-xs font-medium uppercase tracking-wide text-primary">Unlocked</span>}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

import { motion } from "framer-motion";
import { levelProgress } from "@/lib/game/xp";
import { cn } from "@/lib/utils";

export function XpBar({ xp, className, size = "md" }: { xp: number; className?: string; size?: "sm" | "md" }) {
  const progress = levelProgress(xp);
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-gradient-primary font-bold text-primary-foreground shadow-glow",
              size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
            )}
          >
            {progress.level}
          </span>
          <span className="text-sm font-medium text-muted-foreground">Level {progress.level}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {progress.intoLevel} / {progress.neededForLevel} XP
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

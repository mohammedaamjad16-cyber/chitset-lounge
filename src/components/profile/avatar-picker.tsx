import { motion } from "framer-motion";
import { playCue } from "@/lib/audio/audio-manager";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export const AVATAR_EMOJIS = [
  "🎲", "🃏", "♠️", "♥️", "♦️", "♣️", "🀄", "🎴",
  "🏆", "🥇", "🎯", "🎮", "🕹️", "🎉", "⭐", "🔥",
  "🐉", "🦊", "🦁", "🐼", "🐸", "🦄", "🤖", "👾",
];

export function AvatarPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}) {
  const reduced = useReducedMotionPref();

  return (
    <div className={cn("grid grid-cols-6 gap-2", className)}>
      {AVATAR_EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          onClick={() => {
            if (value === emoji) return;
            playCue("select");
            onChange(emoji);
          }}
          aria-pressed={value === emoji}
          whileHover={reduced ? undefined : { scale: 1.05 }}
          whileTap={reduced ? undefined : { scale: 0.92 }}
          animate={reduced ? { scale: 1 } : { scale: value === emoji ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className={cn(
            "flex aspect-square items-center justify-center rounded-xl border text-xl transition",
            value === emoji
              ? "border-primary bg-primary/10 shadow-glow"
              : "border-border bg-muted/40 hover:bg-muted",
          )}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

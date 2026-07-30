import { motion } from "framer-motion";
import type { Chit } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

interface ChitCardProps {
  chit: Chit;
  revealed: boolean;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** A folded paper chit that flips open when tapped. */
export function ChitCard({
  chit,
  revealed,
  onClick,
  selected,
  disabled,
  size = "md",
  className,
}: ChitCardProps) {
  const dims = size === "sm" ? "h-20 w-16" : "h-28 w-20 sm:h-32 sm:w-24";

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      disabled={disabled}
      aria-label={revealed ? `Chit: ${chit.label}` : "Folded chit — tap to unfold"}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 18, rotate: -4 }}
      animate={{ opacity: 1, y: selected ? -10 : 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={disabled ? undefined : { y: selected ? -14 : -6 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "relative shrink-0 rounded-2xl outline-none [perspective:900px]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled && "cursor-not-allowed opacity-70",
        dims,
        className,
      )}
    >
      <motion.span
        className="relative block h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        {/* Folded back */}
        <span
          className={cn(
            "absolute inset-0 grid place-items-center rounded-2xl border border-border/80 bg-gradient-primary text-primary-foreground shadow-card [backface-visibility:hidden]",
            selected && "shadow-glow",
          )}
        >
          <span className="text-2xl" aria-hidden="true">
            📜
          </span>
        </span>

        {/* Unfolded face */}
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border bg-card px-1.5 text-center shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]",
            selected ? "border-primary shadow-glow" : "border-border",
          )}
        >
          <span className={size === "sm" ? "text-xl" : "text-3xl"} aria-hidden="true">
            {chit.emoji}
          </span>
          <span className="w-full truncate text-[11px] font-semibold">{chit.label}</span>
        </span>
      </motion.span>
    </motion.button>
  );
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Chit } from "@/lib/game/engine";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface ChitCardProps {
  chit: Chit;
  revealed: boolean;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Part of a winning set — lifts and glows on the results reveal. */
  highlighted?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** Deterministic per-chit tilt so every folded chit looks hand-made. */
function tiltFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return ((hash % 9) - 4) * 0.6;
}

/** A folded paper chit that flips open when tapped. */
export function ChitCard({
  chit,
  revealed,
  onClick,
  selected,
  disabled,
  highlighted,
  size = "md",
  className,
}: ChitCardProps) {
  const dims = size === "sm" ? "h-20 w-16" : "h-28 w-20 sm:h-32 sm:w-24";
  const reduced = useReducedMotionPref();
  const tilt = useMemo(() => (reduced ? 0 : tiltFor(chit.id)), [chit.id, reduced]);

  const lift = selected ? -12 : highlighted ? -8 : 0;

  return (
    <motion.button
      type="button"
      layout={!reduced}
      onClick={onClick}
      disabled={disabled}
      aria-label={revealed ? `Chit: ${chit.label}` : "Folded chit — activate to unfold"}
      aria-pressed={selected}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, rotate: tilt - 4 }}
      animate={
        reduced
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: lift,
              rotate: selected ? tilt + 3 : tilt,
              scale: selected ? 1.06 : 1,
            }
      }
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      whileHover={disabled || reduced ? undefined : { y: lift - 6 }}
      whileTap={disabled || reduced ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
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
        transition={
          reduced ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {/* Folded back — no information about the hidden chit */}
        <span
          className={cn(
            "chit-paper absolute inset-0 grid place-items-center overflow-hidden rounded-2xl border border-border/80 text-primary-foreground shadow-card [backface-visibility:hidden]",
            selected && "shadow-glow",
          )}
        >
          {/* Fold creases */}
          <span aria-hidden="true" className="absolute inset-x-2 top-1/3 h-px bg-white/25" />
          <span aria-hidden="true" className="absolute inset-x-3 top-2/3 h-px bg-black/10" />
          <span aria-hidden="true" className="absolute inset-y-3 left-1/2 w-px bg-white/15" />
          <span className="relative text-2xl drop-shadow-sm" aria-hidden="true">
            📜
          </span>
        </span>

        {/* Unfolded face */}
        <span
          className={cn(
            "chit-paper-face absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border bg-card px-1.5 text-center shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]",
            selected || highlighted ? "border-primary shadow-glow" : "border-border",
          )}
        >
          <span aria-hidden="true" className="absolute inset-x-2 top-1/3 h-px bg-foreground/5" />
          <span className={size === "sm" ? "text-xl" : "text-3xl"} aria-hidden="true">
            {chit.emoji}
          </span>
          <span className="w-full truncate text-[11px] font-semibold">{chit.label}</span>
          {selected && (
            <motion.span
              initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground"
              aria-hidden="true"
            >
              <Check className="h-2.5 w-2.5" />
            </motion.span>
          )}
        </span>
      </motion.span>
    </motion.button>
  );
}

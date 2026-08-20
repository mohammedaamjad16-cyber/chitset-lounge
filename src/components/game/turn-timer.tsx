import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface TurnTimerProps {
  /** Authoritative turn start from the game state — never a local clock. */
  startedAt: number;
  durationMs: number;
  active: boolean;
  size?: number;
  onWarning?: () => void;
}

/**
 * Circular countdown for the active turn. It only *renders* the authoritative
 * timer coming from the match state; auto-pass is decided by the engine.
 */
export function TurnTimer({ startedAt, durationMs, active, size = 56, onWarning }: TurnTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const reduced = useReducedMotionPref();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active, startedAt]);

  const elapsed = active ? Math.min(durationMs, Math.max(0, now - startedAt)) : 0;
  const remaining = Math.max(0, durationMs - elapsed);
  const seconds = Math.ceil(remaining / 1000);
  const progress = durationMs > 0 ? remaining / durationMs : 0;

  // 8–5s normal · 4–2s warning · final second critical
  const phase = !active ? "idle" : seconds <= 1 ? "critical" : seconds <= 4 ? "warning" : "normal";
  const warning = phase === "warning" || phase === "critical";

  useEffect(() => {
    if (warning) onWarning?.();
  }, [warning, onWarning]);

  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${seconds} seconds left in this turn`}
      animate={
        reduced || phase !== "critical" ? { scale: 1 } : { scale: [1, 1.12, 1] }
      }
      transition={{ duration: 0.5, repeat: phase === "critical" ? Infinity : 0 }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className={cn(
            "transition-[stroke-dashoffset] duration-100 ease-linear",
            phase === "critical"
              ? "stroke-destructive"
              : phase === "warning"
                ? "stroke-warning"
                : "stroke-primary",
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute font-display text-sm font-bold tabular-nums",
          phase === "critical"
            ? "text-destructive"
            : phase === "warning"
              ? "text-warning"
              : "text-foreground",
        )}
      >
        {active ? seconds : "–"}
      </span>
    </motion.div>
  );
}

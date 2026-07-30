import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TurnTimerProps {
  startedAt: number;
  durationMs: number;
  active: boolean;
  size?: number;
  onWarning?: () => void;
}

/** Circular countdown for the active turn. */
export function TurnTimer({ startedAt, durationMs, active, size = 56, onWarning }: TurnTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active, startedAt]);

  const elapsed = active ? Math.min(durationMs, Math.max(0, now - startedAt)) : 0;
  const remaining = Math.max(0, durationMs - elapsed);
  const seconds = Math.ceil(remaining / 1000);
  const progress = durationMs > 0 ? remaining / durationMs : 0;
  const warning = active && seconds <= 3;

  useEffect(() => {
    if (warning) onWarning?.();
  }, [warning, onWarning]);

  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${seconds} seconds left in this turn`}
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
            warning ? "stroke-destructive" : "stroke-primary",
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute font-display text-sm font-bold tabular-nums",
          warning ? "text-destructive" : "text-foreground",
          warning && "animate-pulse",
        )}
      >
        {active ? seconds : "–"}
      </span>
    </div>
  );
}

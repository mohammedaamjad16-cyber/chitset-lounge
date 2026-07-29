import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-9 w-9">
        <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="chit-g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.545 0.24 275)" />
              <stop offset="100%" stopColor="oklch(0.55 0.26 300)" />
            </linearGradient>
            <linearGradient id="chit-g2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.26 300)" />
              <stop offset="100%" stopColor="oklch(0.72 0.19 145)" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="15" height="15" rx="3" fill="url(#chit-g1)" transform="rotate(-8 11.5 11.5)" />
          <rect x="21" y="4" width="15" height="15" rx="3" fill="url(#chit-g2)" transform="rotate(6 28.5 11.5)" />
          <rect x="4" y="21" width="15" height="15" rx="3" fill="url(#chit-g2)" transform="rotate(4 11.5 28.5)" opacity="0.85" />
          <rect x="21" y="21" width="15" height="15" rx="3" fill="url(#chit-g1)" transform="rotate(-6 28.5 28.5)" />
        </svg>
      </div>
      {showText && (
        <span className="font-display text-xl font-bold tracking-tight">
          Chit<span className="text-gradient">Set</span>
        </span>
      )}
    </div>
  );
}

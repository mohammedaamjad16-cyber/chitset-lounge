import type { LucideIcon } from "lucide-react";
import { Users, SearchX, KeyRound, DoorClosed, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  tone?: "default" | "danger";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  tone = "default",
}: EmptyStateProps) {
  return (
    <GlassCard className={cn("mx-auto max-w-md p-8 text-center", className)}>
      <div
        className={cn(
          "mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl shadow-glow",
          tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-gradient-primary text-primary-foreground",
        )}
        aria-hidden="true"
      >
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5 min-h-11" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </GlassCard>
  );
}

/** Preset empty states used across the pre-game flow. */
export const emptyStatePresets = {
  noPlayers: {
    icon: Users,
    title: "No players yet",
    description: "Share your room code and your friends will show up here instantly.",
  },
  roomNotFound: {
    icon: SearchX,
    title: "Room not found",
    description: "This room may have closed or the code has expired.",
    tone: "danger" as const,
  },
  invalidCode: {
    icon: KeyRound,
    title: "Invalid room code",
    description: "Room codes are 4–10 characters and use letters, numbers and dashes.",
    tone: "danger" as const,
  },
  roomFull: {
    icon: DoorClosed,
    title: "Room is full",
    description: "Every seat at this table is taken. Try another room or create your own.",
  },
  networkError: {
    icon: WifiOff,
    title: "Connection lost",
    description: "We couldn't reach the game servers. Check your connection and try again.",
    tone: "danger" as const,
  },
} satisfies Record<string, Omit<EmptyStateProps, "onAction" | "actionLabel">>;

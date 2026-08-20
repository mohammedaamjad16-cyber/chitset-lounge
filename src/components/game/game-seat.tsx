import { motion } from "framer-motion";
import { Bot, Crown, WifiOff, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TurnTimer } from "./turn-timer";
import type { MatchPlayer } from "@/lib/game/match-store";
import { ReactionOverlay } from "@/components/chat/reaction-overlay";
import type { Reaction } from "@/lib/chat/use-reactions";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

interface GameSeatProps {
  player: MatchPlayer;
  handCount: number;
  isActive: boolean;
  isMe: boolean;
  turnStartedAt: number;
  turnDurationMs: number;
  compact?: boolean;
  reactions?: Reaction[];
  /** True while a chit is flying towards this seat. */
  receiving?: boolean;
}

export function GameSeat({
  player,
  handCount,
  isActive,
  isMe,
  turnStartedAt,
  turnDurationMs,
  compact,
  reactions,
  receiving,
}: GameSeatProps) {
  const reduced = useReducedMotionPref();

  return (
    <motion.div
      layout={!reduced}
      animate={
        reduced
          ? {}
          : receiving
            ? { scale: [1, 1.08, 1] }
            : isActive
              ? { scale: 1.04 }
              : { scale: 1 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "relative flex w-32 flex-col items-center gap-1.5 rounded-2xl border bg-card/80 p-2.5 text-center backdrop-blur transition-colors sm:w-36",
        isActive ? "border-primary shadow-glow" : "border-border",
        receiving && "border-success/70",
        compact && "w-full",
      )}
    >
      {/* Active-turn ring — clear without flashing */}
      {isActive && !reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-0.5 rounded-2xl ring-2 ring-primary/60"
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {reactions && reactions.length > 0 && (
        <ReactionOverlay reactions={reactions} playerId={player.id} />
      )}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-gradient-primary text-[11px] font-semibold text-primary-foreground">
              {initials(player.name)}
            </AvatarFallback>
          </Avatar>
          {!player.connected && (
            <span
              className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-muted-foreground"
              aria-label="Reconnecting"
            >
              <WifiOff className="h-2 w-2 text-background" />
            </span>
          )}
        </div>
        <TurnTimer
          startedAt={turnStartedAt}
          durationMs={turnDurationMs}
          active={isActive}
          size={38}
        />
      </div>

      <p className="w-full truncate text-xs font-semibold">
        {player.name}
        {isMe && <span className="text-muted-foreground"> (you)</span>}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1">
        {player.isHost && (
          <Badge variant="secondary" className="gap-1 px-1.5 text-[10px]">
            <Crown className="h-2.5 w-2.5" /> Host
          </Badge>
        )}
        {player.isBot && (
          <Badge variant="outline" className="gap-1 border-primary/50 px-1.5 text-[10px] text-primary">
            <Bot className="h-2.5 w-2.5" /> BOT
          </Badge>
        )}
        {player.team && (
          <Badge
            className={cn(
              "px-1.5 text-[10px]",
              player.team === "A"
                ? "bg-primary text-primary-foreground"
                : "bg-success text-success-foreground",
            )}
          >
            Team {player.team}
          </Badge>
        )}
        <Badge variant="outline" className="px-1.5 text-[10px]">
          {handCount} chits
        </Badge>
      </div>

      {!player.connected ? (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-2.5 w-2.5 animate-spin" /> Reconnecting…
        </p>
      ) : player.isBot && isActive ? (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground" aria-live="polite">
          <Loader2 className="h-2.5 w-2.5 animate-spin" /> thinking…
        </p>
      ) : null}

      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: handCount }).map((_, i) => (
          <span key={i} className="chit-paper h-3.5 w-2.5 rounded-[3px] opacity-90" />
        ))}
      </div>
    </motion.div>
  );
}

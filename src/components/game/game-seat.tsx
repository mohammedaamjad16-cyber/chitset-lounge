import { motion } from "framer-motion";
import { Crown, WifiOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TurnTimer } from "./turn-timer";
import type { MatchPlayer } from "@/lib/game/match-store";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

import { ReactionOverlay } from "@/components/chat/reaction-overlay";
import type { Reaction } from "@/lib/chat/use-reactions";

interface GameSeatProps {
  player: MatchPlayer;
  handCount: number;
  isActive: boolean;
  isMe: boolean;
  turnStartedAt: number;
  turnDurationMs: number;
  compact?: boolean;
  reactions?: Reaction[];
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
}: GameSeatProps) {
  return (
    <motion.div
      layout
      animate={isActive ? { scale: 1.04 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "relative flex w-32 flex-col items-center gap-1.5 rounded-2xl border bg-card/80 p-2.5 text-center backdrop-blur transition-colors sm:w-36",
        isActive ? "border-primary shadow-glow" : "border-border",
        compact && "w-full",
      )}
    >
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
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-muted-foreground">
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
        <Badge variant="outline" className="px-1.5 text-[10px]">
          {handCount} chits
        </Badge>
      </div>

      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: handCount }).map((_, i) => (
          <span key={i} className="h-3.5 w-2.5 rounded-[3px] bg-gradient-primary opacity-80" />
        ))}
      </div>
    </motion.div>
  );
}

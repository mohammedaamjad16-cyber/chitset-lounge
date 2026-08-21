import { memo } from "react";
import { motion } from "framer-motion";
import { Bot, Crown, Wifi, WifiOff, Check, UserPlus } from "lucide-react";
import type { Player } from "@/lib/game/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const PlayerSeat = memo(function PlayerSeat({
  player,
  className,
}: {
  player?: Player;
  className?: string;
}) {
  if (!player) {
    return (
      <div
        className={cn(
          "flex w-36 flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-card/40 p-3 text-center backdrop-blur",
          className,
        )}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
          <UserPlus className="h-5 w-5" />
        </div>
        <p className="text-xs text-muted-foreground">Waiting for Player...</p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "flex w-36 flex-col items-center gap-2 rounded-2xl border bg-card/70 p-3 text-center backdrop-blur transition-colors",
        player.isReady ? "border-success/60 shadow-glow" : "border-border",
        className,
      )}
    >
      <div className="relative">
        <Avatar className="h-11 w-11 border border-border">
          <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
            {initials(player.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background",
            player.connection === "connected" ? "bg-success" : "bg-muted-foreground",
          )}
          aria-label={player.connection === "connected" ? "Connected" : "Disconnected"}
        >
          {player.connection === "connected" ? (
            <Wifi className="h-2 w-2 text-success-foreground" />
          ) : (
            <WifiOff className="h-2 w-2 text-background" />
          )}
        </span>
      </div>

      <div className="min-w-0 w-full">
        <p className="truncate text-sm font-semibold">{player.name}</p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
          {player.isHost && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Crown className="h-3 w-3" /> Host
            </Badge>
          )}
          {player.isBot && (
            <Badge variant="outline" className="gap-1 border-primary/50 text-[10px] text-primary">
              <Bot className="h-3 w-3" /> BOT
            </Badge>
          )}
          {player.team && (
            <Badge
              className={cn(
                "text-[10px]",
                player.team === "A"
                  ? "bg-primary text-primary-foreground"
                  : "bg-success text-success-foreground",
              )}
            >
              Team {player.team}
            </Badge>
          )}
          <Badge
            className={cn(
              "gap-1 text-[10px]",
              player.isReady
                ? "bg-success text-success-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {player.isReady && <Check className="h-3 w-3" />}
            {player.isReady ? "Ready" : "Not Ready"}
          </Badge>
        </div>
      </div>

      {/* Reserved space for future profile stats */}
      <div className="h-3 w-full" aria-hidden="true" />
    </motion.div>
  );
});

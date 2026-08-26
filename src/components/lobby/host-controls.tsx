import { Play, Copy, UserPlus, Settings, Crown, UserMinus, DoorClosed, Bot, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ButtonLoader } from "@/components/shared/loaders";
import type { Player } from "@/lib/game/types";

interface HostControlsProps {
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
  onCopyCode: () => void;
  onInvite: () => void;
  onSettings: () => void;
  /** Everyone else at the table — targets for transfer / kick. */
  otherPlayers: Player[];
  /** True when fewer than two players are seated. */
  notEnoughPlayers: boolean;
  allowBots: boolean;
  seatsOpen: number;
  onAddBots: () => void;
  onKickPlayer: (playerId: string) => void;
  onTransferHost: (playerId: string) => void;
  onCloseRoom: () => void;
}

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function HostControls({
  canStart,
  starting,
  onStart,
  onCopyCode,
  onInvite,
  onSettings,
  otherPlayers,
  notEnoughPlayers,
  allowBots,
  seatsOpen,
  onAddBots,
  onKickPlayer,
  onTransferHost,
  onCloseRoom,
}: HostControlsProps) {
  return (
    <GlassCard className="p-5">
      <h2 className="font-display text-sm font-semibold">Host Controls</h2>

      {notEnoughPlayers && (
        <div className="mt-3 rounded-xl border border-warning/50 bg-warning/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3.5 w-3.5" /> Not enough players.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {allowBots
              ? "Fill the empty seats with bots, or keep waiting."
              : "Turn on Allow Bots or wait for more players to join."}
          </p>
          {allowBots && seatsOpen > 0 && (
            <Button size="sm" variant="outline" className="mt-2 min-h-9 w-full" onClick={onAddBots}>
              <Bot className="mr-1.5 h-4 w-4" /> Add Bots
            </Button>
          )}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <Button
                className="min-h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
                disabled={!canStart || starting}
                onClick={onStart}
              >
                {starting ? (
                  <ButtonLoader label="Starting..." />
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4" /> Start Game
                  </>
                )}
              </Button>
            </span>
          </TooltipTrigger>
          {!canStart && <TooltipContent>All players must be ready first</TooltipContent>}
        </Tooltip>

        <Button variant="outline" className="min-h-11 w-full" onClick={onCopyCode}>
          <Copy className="mr-1.5 h-4 w-4" /> Copy Room Code
        </Button>
        <Button variant="outline" className="min-h-11 w-full" onClick={onInvite}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite Players
        </Button>
        <Button variant="outline" className="min-h-11 w-full" onClick={onSettings}>
          <Settings className="mr-1.5 h-4 w-4" /> Room Settings
        </Button>
      </div>

      {otherPlayers.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Manage table
          </p>
          <ul className="space-y-1.5">
            {otherPlayers.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-2 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarFallback className="bg-muted text-[9px] font-semibold">
                      {initials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium">
                    {player.name}
                    {player.isBot && <span className="ml-1 text-[10px] text-primary">BOT</span>}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        aria-label={`Make ${player.name} the host`}
                        onClick={() => onTransferHost(player.id)}
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Transfer Host</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        aria-label={`Remove ${player.name} from the room`}
                        onClick={() => onKickPlayer(player.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Kick Player</TooltipContent>
                  </Tooltip>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="mt-3 block">
            <Button
              variant="ghost"
              className="min-h-11 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onCloseRoom}
            >
              <DoorClosed className="mr-1.5 h-4 w-4" /> Close Room
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Ends the room for everyone</TooltipContent>
      </Tooltip>
    </GlassCard>
  );
}

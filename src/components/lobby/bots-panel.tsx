import { Bot, Scale, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BotDifficulty } from "@/lib/game/bots";

interface BotsPanelProps {
  allowBots: boolean;
  botDifficulty: BotDifficulty;
  teamMode: boolean;
  playerCount: number;
  botCount: number;
  seatsOpen: number;
  notEnoughPlayers: boolean;
  onToggleAllowBots: (v: boolean) => void;
  onDifficultyChange: (v: BotDifficulty) => void;
  onAddBots: () => void;
  onRemoveBots: () => void;
  onBalanceTeams: () => void;
}

export function BotsPanel({
  allowBots,
  botDifficulty,
  teamMode,
  playerCount,
  botCount,
  seatsOpen,
  notEnoughPlayers,
  onToggleAllowBots,
  onDifficultyChange,
  onAddBots,
  onRemoveBots,
  onBalanceTeams,
}: BotsPanelProps) {
  return (
    <GlassCard className="p-5">
      <h2 className="font-display text-sm font-semibold">Bots</h2>

      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">Allow Bots</p>
            <p className="text-xs text-muted-foreground">Fill empty seats with AI players.</p>
          </div>
          <Switch checked={allowBots} onCheckedChange={onToggleAllowBots} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bots-difficulty">Bot Difficulty</Label>
          <Select
            value={botDifficulty}
            onValueChange={(v) => onDifficultyChange(v as BotDifficulty)}
            disabled={!allowBots}
          >
            <SelectTrigger id="bots-difficulty" className="min-h-11" disabled={!allowBots}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy — plays loosely</SelectItem>
              <SelectItem value="normal">Normal — sensible strategy</SelectItem>
              <SelectItem value="hard">Hard — strong strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="min-h-11" disabled={!allowBots || seatsOpen === 0} onClick={onAddBots}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Add Bot{seatsOpen === 1 ? "" : "s"}
          </Button>
          <Button variant="outline" className="min-h-11" disabled={!allowBots || botCount === 0} onClick={onRemoveBots}>
            <UserMinus className="mr-1.5 h-4 w-4" /> Remove Bots
          </Button>
        </div>

        {teamMode && (
          <Button variant="outline" className="min-h-11 w-full" disabled={!allowBots} onClick={onBalanceTeams}>
            <Scale className="mr-1.5 h-4 w-4" /> Balance Teams
          </Button>
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5" />
          {playerCount} of {playerCount + seatsOpen} seats filled · {botCount}{" "}
          {botCount === 1 ? "bot" : "bots"} seated
          {!allowBots && notEnoughPlayers && " · turn on Allow Bots to fill the table"}
        </p>
      </div>
    </GlassCard>
  );
}

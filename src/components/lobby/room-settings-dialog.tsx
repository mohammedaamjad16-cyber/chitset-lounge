import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryGrid } from "@/components/room/category-grid";
import { playCue } from "@/lib/audio/audio-manager";
import { notify } from "@/lib/notify";
import {
  autoBalanceTeams,
  clearTeams,
  isOnlineMode,
  updateRoomSettings,
} from "@/lib/game/room-store";
import { updateOnlineRoom } from "@/lib/realtime/room-sync";
import type { GameMode, RoomState, RoomVisibility } from "@/lib/game/types";
import type { BotDifficulty } from "@/lib/game/bots";

export function RoomSettingsDialog({
  open,
  onOpenChange,
  room,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  room: RoomState;
}) {
  const [maxPlayers, setMaxPlayers] = useState(String(room.maxPlayers));
  const [categoryId, setCategoryId] = useState(room.categoryId);
  const [visibility, setVisibility] = useState<RoomVisibility>(room.visibility);
  const [gameMode, setGameMode] = useState<GameMode>(room.gameMode ?? "classic");
  const [allowBots, setAllowBots] = useState(room.allowBots ?? true);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(room.botDifficulty ?? "normal");

  const save = () => {
    updateRoomSettings({
      maxPlayers: Number(maxPlayers),
      categoryId,
      visibility,
      gameMode,
      allowBots,
      botDifficulty,
    });
    if (gameMode === "team") autoBalanceTeams();
    else clearTeams();
    // Online rooms must push settings to the backend, or remote players never see them.
    if (isOnlineMode()) {
      void updateOnlineRoom(room.code, {
        max_players: Number(maxPlayers),
        category_id: categoryId,
        visibility,
        game_mode: gameMode,
      }).catch(() =>
        notify.error("Couldn't sync settings", "Changes apply to your device only."),
      );
    }
    notify.success("Settings updated", "Your room configuration has been saved.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Room Settings</DialogTitle>
          <DialogDescription>Adjust the table before the match begins.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-max">Maximum Players</Label>
              <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                <SelectTrigger id="settings-max" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)} disabled={n < room.players.length}>
                      {n} players
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-visibility">Private Room</Label>
              <div className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3">
                <Switch
                  id="settings-visibility"
                  checked={visibility === "private"}
                  onCheckedChange={(c) => setVisibility(c ? "private" : "public")}
                />
                <span className="text-sm text-muted-foreground">
                  {visibility === "private" ? "Only players with the code" : "Anyone can join"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <CategoryGrid value={categoryId} onChange={setCategoryId} playerCount={Number(maxPlayers)} />
          </div>

          <div className="space-y-3">
            <Label>Advanced</Label>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Team Mode</p>
                <p className="text-xs text-muted-foreground">Players are split into Team A and Team B.</p>
              </div>
              <Switch
                checked={gameMode === "team"}
                onCheckedChange={(c) => {
                  playCue("select");
                  setGameMode(c ? "team" : "classic");
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">Allow Bots</p>
                <p className="text-xs text-muted-foreground">Fill empty seats with AI players.</p>
              </div>
              <Switch checked={allowBots} onCheckedChange={setAllowBots} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-bot-difficulty">Bot Difficulty</Label>
              <Select
                value={botDifficulty}
                onValueChange={(v) => setBotDifficulty(v as "easy" | "normal" | "hard")}
              >
                <SelectTrigger id="settings-bot-difficulty" className="min-h-11" disabled={!allowBots}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy — plays loosely</SelectItem>
                  <SelectItem value="normal">Normal — sensible strategy</SelectItem>
                  <SelectItem value="hard">Hard — strong strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="min-h-11" onClick={save}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

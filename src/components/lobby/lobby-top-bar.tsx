import { Copy, Share2, Users, Tag, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/shared/glass-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RoomState } from "@/lib/game/types";

interface LobbyTopBarProps {
  room: RoomState;
  categoryName: string;
  onCopyCode: () => void;
}

export function LobbyTopBar({ room, categoryName, onCopyCode }: LobbyTopBarProps) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{room.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-sm tracking-widest text-muted-foreground">
              {room.code}
            </span>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {room.visibility}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" className="min-h-11" onClick={onCopyCode}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy Code
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button size="sm" variant="outline" className="min-h-11" disabled aria-label="Share room">
                  <Share2 className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sharing arrives in a future update</TooltipContent>
          </Tooltip>
        </div>

        <dl className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:col-auto sm:w-full">
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4" aria-hidden="true" />
            <dt className="sr-only">Category</dt>
            <dd>{categoryName}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            <dt className="sr-only">Maximum players</dt>
            <dd>Max {room.maxPlayers}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Signal className="h-4 w-4 text-success" aria-hidden="true" />
            <dt className="sr-only">Connected players</dt>
            <dd>{room.players.length} connected</dd>
          </div>
        </dl>
      </div>
    </GlassCard>
  );
}

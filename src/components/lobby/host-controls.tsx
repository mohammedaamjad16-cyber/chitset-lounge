import { Play, Copy, UserPlus, Settings, Crown, UserMinus, DoorClosed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ButtonLoader } from "@/components/shared/loaders";

interface HostControlsProps {
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
  onCopyCode: () => void;
  onInvite: () => void;
  onSettings: () => void;
}

export function HostControls({
  canStart,
  starting,
  onStart,
  onCopyCode,
  onInvite,
  onSettings,
}: HostControlsProps) {
  return (
    <GlassCard className="p-5">
      <h2 className="font-display text-sm font-semibold">Host Controls</h2>
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

        <Disabled icon={Crown} label="Transfer Host" reason="Host transfer arrives with realtime multiplayer" />
        <Disabled icon={UserMinus} label="Kick Player" reason="Moderation tools arrive in a future milestone" />
        <Disabled icon={DoorClosed} label="Close Room" reason="Room lifecycle controls need the backend" />
      </div>
    </GlassCard>
  );
}

function Disabled({
  icon: Icon,
  label,
  reason,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  reason: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block">
          <Button variant="ghost" className="min-h-11 w-full justify-start" disabled>
            <Icon className="mr-1.5 h-4 w-4" /> {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

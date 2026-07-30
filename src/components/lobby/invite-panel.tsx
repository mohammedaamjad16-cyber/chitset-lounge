import { Copy, Link2, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/shared/glass-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function InvitePanel({ code, onCopyCode }: { code: string; onCopyCode: () => void }) {
  return (
    <GlassCard className="p-5">
      <h2 className="font-display text-sm font-semibold">Invite players</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Share this code so friends can join your table.
      </p>
      <div className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-center font-display text-lg tracking-[0.3em]">
        {code}
      </div>
      <div className="mt-3 space-y-2">
        <Button className="min-h-11 w-full" onClick={onCopyCode}>
          <Copy className="mr-1.5 h-4 w-4" /> Copy Room Code
        </Button>
        <DisabledAction icon={Link2} label="Copy Invite Link" />
        <DisabledAction icon={QrCode} label="QR Code" />
        <DisabledAction icon={Share2} label="Share" />
      </div>
    </GlassCard>
  );
}

function DisabledAction({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block">
          <Button variant="outline" className="min-h-11 w-full justify-between" disabled>
            <span className="flex items-center">
              <Icon className="mr-1.5 h-4 w-4" /> {label}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Coming Soon
            </Badge>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Available in a future milestone</TooltipContent>
    </Tooltip>
  );
}

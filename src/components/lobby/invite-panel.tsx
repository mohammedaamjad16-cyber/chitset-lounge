import { useState } from "react";
import { Check, Copy, Link2, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { InviteDialog } from "@/components/invite/invite-dialog";
import { playCue } from "@/lib/audio/audio-manager";
import { notify } from "@/lib/notify";

interface InvitePanelProps {
  code: string;
  onCopyCode: () => void;
}

export function InvitePanel({ code, onCopyCode }: InvitePanelProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinLink =
    typeof window !== "undefined" ? `${window.location.origin}/join-room?code=${code}` : "";

  const copyInviteLink = async () => {
    playCue("select");
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopiedLink(true);
      notify.success("Invite link copied", "It opens the join page with the code filled in.");
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      notify.error("Couldn't copy", "Share the room code instead.");
    }
  };

  const shareRoom = async () => {
    playCue("select");
    if (typeof navigator.share !== "undefined") {
      try {
        await navigator.share({ title: `Join my ChitSet room ${code}`, url: joinLink });
        return;
      } catch {
        /* dismissed — fall through to clipboard */
      }
    }
    void copyInviteLink();
  };

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
        <Button variant="outline" className="min-h-11 w-full" onClick={() => void copyInviteLink()}>
          {copiedLink ? (
            <Check className="mr-1.5 h-4 w-4 text-success" />
          ) : (
            <Link2 className="mr-1.5 h-4 w-4" />
          )}
          Copy Invite Link
        </Button>
        <Button variant="outline" className="min-h-11 w-full" onClick={() => { playCue("select"); setQrOpen(true); }}>
          <QrCode className="mr-1.5 h-4 w-4" /> QR Code
        </Button>
        <Button variant="outline" className="min-h-11 w-full" onClick={() => void shareRoom()}>
          <Share2 className="mr-1.5 h-4 w-4" /> Share
        </Button>
      </div>

      <InviteDialog roomCode={code} open={qrOpen} onOpenChange={setQrOpen} />
    </GlassCard>
  );
}

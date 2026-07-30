import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Share2, Send, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FriendRow } from "@/components/friends/friend-row";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { useFriends } from "@/lib/friends/queries";
import { notify } from "@/lib/notify";

export interface InviteDialogProps {
  roomCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function InviteDialog({ roomCode, open, onOpenChange }: InviteDialogProps) {
  const { isGuest } = useAuth();
  const { data: friends = [] } = useFriends();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinLink =
    typeof window !== "undefined" ? `${window.location.origin}/join-room?code=${roomCode}` : "";

  useEffect(() => {
    if (!open || !canvasRef.current || !joinLink) return;
    void QRCode.toCanvas(canvasRef.current, joinLink, {
      width: 176,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => {
      /* ignore canvas render failures (e.g. unmounted) */
    });
  }, [open, joinLink]);

  const handleCopyCode = async () => {
    const ok = await copyText(roomCode);
    if (ok) {
      setCopiedCode(true);
      notify.success("Room code copied");
      setTimeout(() => setCopiedCode(false), 1500);
    } else {
      notify.error("Couldn't copy code");
    }
  };

  const shareOrCopyLink = async (): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my ChitSet match", url: joinLink });
        return true;
      } catch {
        // fall through to copy
      }
    }
    return copyText(joinLink);
  };

  const handleShareLink = async () => {
    const ok = await shareOrCopyLink();
    if (ok) {
      setCopiedLink(true);
      notify.success("Invite link ready", "Link copied or shared.");
      setTimeout(() => setCopiedLink(false), 1500);
    } else {
      notify.error("Couldn't share link");
    }
  };

  const handleInviteFriend = async () => {
    const ok = await shareOrCopyLink();
    if (ok) {
      notify.success("Invite sent", "Share the link with your friend to join.");
    } else {
      notify.error("Couldn't create invite");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Invite players</DialogTitle>
          <DialogDescription>Share your room code or link so friends can jump in.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-card/60 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Room code</p>
              <p className="font-display text-2xl font-bold tracking-widest">{roomCode}</p>
            </div>
            <Button size="sm" variant="secondary" className="min-h-9" onClick={handleCopyCode}>
              {copiedCode ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              Copy
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card/60 p-4">
            <canvas ref={canvasRef} className="rounded-xl bg-white p-2" aria-label="QR code to join room" />
            <Button size="sm" className="min-h-9 w-full bg-gradient-primary text-primary-foreground" onClick={handleShareLink}>
              {copiedLink ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Share2 className="mr-1.5 h-3.5 w-3.5" />}
              Share join link
            </Button>
            <p className="w-full truncate text-center text-xs text-muted-foreground">{joinLink}</p>
          </div>

          {!isGuest && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Invite a friend
              </p>
              {friends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No friends yet"
                  description="Add friends to invite them directly to your room."
                  className="p-5"
                />
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {friends.map(({ friendshipId, profile }) => (
                    <FriendRow
                      key={friendshipId}
                      profile={profile}
                      action={
                        <Button size="sm" variant="secondary" className="min-h-9" onClick={handleInviteFriend}>
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Invite
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

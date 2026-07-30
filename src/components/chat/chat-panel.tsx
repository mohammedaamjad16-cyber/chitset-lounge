import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Send, MessageCircleOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/chat/use-chat";
import { useReactions } from "@/lib/chat/use-reactions";
import { useSettings } from "@/lib/settings/settings-store";

const QUICK_EMOJI = ["👍", "😂", "😮", "🔥", "😭", "🎉"];

export interface ChatPanelProps {
  roomCode: string;
  selfId: string;
  variant?: "lobby" | "game";
  className?: string;
}

export function ChatPanel({ roomCode, selfId, variant = "lobby", className }: ChatPanelProps) {
  const { messages, send, canSend, sendDisabledReason, connected } = useChat(roomCode);
  const { sendReaction } = useReactions(roomCode, selfId);
  const settings = useSettings();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const compact = variant === "game";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const canType = canSend && settings.chatEnabled;

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !canType) return;
    send(trimmed);
    setDraft("");
  };

  const notice = useMemo(() => {
    if (!settings.chatEnabled) return "Chat is disabled in your settings.";
    if (!canSend) return sendDisabledReason;
    return null;
  }, [settings.chatEnabled, canSend, sendDisabledReason]);

  return (
    <GlassCard className={cn("flex flex-col overflow-hidden", compact ? "p-3 gap-2" : "p-4 gap-3", className)}>
      <ScrollArea className={cn(compact ? "h-40" : "h-72", "pr-2")}>
        <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No messages yet — say hi!</p>
          )}
          {messages.map((m) => {
            const isOwn = m.userId === selfId;
            const isSystem = m.kind !== "chat";
            if (isSystem) {
              return (
                <p key={m.id} className="text-center text-xs text-muted-foreground italic py-1">
                  {m.body}
                </p>
              );
            }
            return (
              <div key={m.id} className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
                {!isOwn && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                    {m.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className={cn("max-w-[75%] flex flex-col", isOwn && "items-end")}>
                  {!isOwn && (
                    <span className="text-[10px] font-medium text-muted-foreground px-1">{m.displayName}</span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-1.5 text-sm break-words",
                      isOwn
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.body}
                  </div>
                  <span className="text-[9px] text-muted-foreground px-1 mt-0.5">
                    {formatDistanceToNowStrict(new Date(m.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {settings.showReactions && (
        <div className="flex items-center justify-between gap-1">
          {QUICK_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendReaction(emoji)}
              className="flex-1 rounded-xl bg-muted/60 py-1.5 text-lg transition hover:bg-muted active:scale-90"
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {canType ? (
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            maxLength={280}
            placeholder="Type a message..."
            className="h-9 rounded-xl text-sm"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            disabled={!draft.trim()}
            onClick={handleSend}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-muted/50 py-2 text-xs text-muted-foreground">
          <MessageCircleOff className="h-3.5 w-3.5" />
          <span>{notice}</span>
        </div>
      )}
      {!connected && canType && (
        <p className="text-[10px] text-muted-foreground text-center -mt-1">Reconnecting to chat…</p>
      )}
    </GlassCard>
  );
}

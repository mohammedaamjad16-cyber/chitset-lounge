import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useChat } from "@/lib/chat/use-chat";

export interface ChatSheetProps {
  roomCode: string;
  selfId: string;
  unreadEnabled?: boolean;
}

export function ChatSheet({ roomCode, selfId, unreadEnabled = true }: ChatSheetProps) {
  const { messages } = useChat(roomCode);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const seenCount = useRef(0);

  useEffect(() => {
    if (open) {
      seenCount.current = messages.length;
      setUnread(0);
      return;
    }
    if (!unreadEnabled) return;
    const delta = messages.length - seenCount.current;
    if (delta > 0) {
      const newOnes = messages.slice(seenCount.current);
      const fromOthers = newOnes.filter((m) => m.userId !== selfId).length;
      if (fromOthers > 0) setUnread((u) => u + fromOthers);
    }
    seenCount.current = messages.length;
  }, [messages, open, unreadEnabled, selfId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl p-4">
        <SheetHeader>
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>
        <div className="mt-3 h-full">
          <ChatPanel roomCode={roomCode} selfId={selfId} variant="game" className="h-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

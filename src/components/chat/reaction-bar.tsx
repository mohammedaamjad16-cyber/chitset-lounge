import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJIS = ["😂", "🔥", "😮", "😎", "👏", "😭", "🎉", "🤝"];

export interface ReactionBarProps {
  onSend: (emoji: string) => void;
  className?: string;
}

export function ReactionBar({ onSend, className }: ReactionBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Send ${emoji} reaction`}
          className="h-9 w-9 rounded-full p-0 text-base"
          onClick={() => onSend(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}

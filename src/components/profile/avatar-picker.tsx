import { cn } from "@/lib/utils";

export const AVATAR_EMOJIS = [
  "🎲", "🃏", "♠️", "♥️", "♦️", "♣️", "🀄", "🎴",
  "🏆", "🥇", "🎯", "🎮", "🕹️", "🎉", "⭐", "🔥",
  "🐉", "🦊", "🦁", "🐼", "🐸", "🦄", "🤖", "👾",
];

export function AvatarPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-6 gap-2", className)}>
      {AVATAR_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-pressed={value === emoji}
          className={cn(
            "flex aspect-square items-center justify-center rounded-xl border text-xl transition",
            value === emoji
              ? "border-primary bg-primary/10 shadow-glow"
              : "border-border bg-muted/40 hover:bg-muted",
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

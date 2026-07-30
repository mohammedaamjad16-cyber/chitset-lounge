import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth/auth-context";

const presenceConfig: Record<Profile["presence"], { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-emerald-500" },
  in_lobby: { label: "In lobby", dot: "bg-primary" },
  in_match: { label: "In match", dot: "bg-accent" },
  offline: { label: "Offline", dot: "bg-muted-foreground/40" },
};

export interface FriendRowProps {
  profile: Pick<Profile, "username" | "avatar_emoji" | "level" | "presence">;
  action?: ReactNode;
  className?: string;
}

export function FriendRow({ profile, action, className }: FriendRowProps) {
  const presence = presenceConfig[profile.presence] ?? presenceConfig.offline;
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-card/50 p-3", className)}>
      <div className="relative shrink-0">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-primary text-xl shadow-glow">
          <span aria-hidden="true">{profile.avatar_emoji || "🙂"}</span>
        </div>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
            presence.dot,
          )}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{profile.username}</p>
        <p className="text-xs text-muted-foreground">
          Level {profile.level} · {presence.label}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

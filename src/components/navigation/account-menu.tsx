import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, User, Trophy, History, Settings, Users, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { levelProgress } from "@/lib/game/xp";
import { notify } from "@/lib/notify";

const MENU_LINKS = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/achievements", label: "Achievements", icon: Medal },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/history", label: "Match history", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { session, profile, guestName, signOut } = useAuth();
  const navigate = useNavigate();

  if (!session) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link to="/auth" onClick={onNavigate}>
          <LogIn className="mr-1.5 h-4 w-4" /> Sign in
        </Link>
      </Button>
    );
  }

  const progress = levelProgress(profile?.xp ?? 0);
  const name = profile?.username ?? guestName;

  async function handleSignOut() {
    await signOut();
    notify.success("Signed out");
    onNavigate?.();
    void navigate({ to: "/", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full px-2"
          aria-label="Account menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-sm">
            {profile?.avatar_emoji ?? "🎲"}
          </span>
          <span className="hidden max-w-24 truncate text-sm font-medium sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-lg">
            {profile?.avatar_emoji ?? "🎲"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <Badge variant="secondary" className="mt-0.5 text-[10px]">
              Level {progress.level} · {progress.percent}%
            </Badge>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MENU_LINKS.map((l) => (
          <DropdownMenuItem key={l.to} asChild>
            <Link to={l.to} onClick={onNavigate}>
              <l.icon className="mr-2 h-4 w-4" /> {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

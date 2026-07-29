import { Link } from "@tanstack/react-router";
import { Github, Twitter, Heart } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              A modern real-time multiplayer take on the classic 4 Chit game. Pass smart, collect four, win together.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Play</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/create-room" className="hover:text-foreground">Create Room</Link></li>
              <li><Link to="/join-room" className="hover:text-foreground">Join Room</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Discover</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/" hash="faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ChitSet · Built with <Heart className="inline h-3 w-3 text-destructive" /> for friends
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="GitHub" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

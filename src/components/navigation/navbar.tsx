import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Plus, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/navigation/account-menu";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-background/70 border-b border-border shadow-soft"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0 transition-transform hover:scale-[1.02]">
          <Logo />
        </Link>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-muted"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/join-room">
                <LogIn className="mr-1.5 h-4 w-4" /> Join Room
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
              <Link to="/create-room">
                <Plus className="mr-1.5 h-4 w-4" /> Create Room
              </Link>
            </Button>
          </div>
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-2 mb-8">
                <Logo />
              </div>
              <AnimatePresence>
                <div className="flex flex-col gap-1">
                  {NAV_LINKS.map((l, i) => (
                    <motion.div
                      key={l.to}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={l.to}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
              <div className="mt-4">
                <AccountMenu onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                  <Link to="/join-room">
                    <LogIn className="mr-2 h-4 w-4" /> Join Room
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-primary text-primary-foreground" onClick={() => setMobileOpen(false)}>
                  <Link to="/create-room">
                    <Plus className="mr-2 h-4 w-4" /> Create Room
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Plus, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Real-time multiplayer · No downloads
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Pass Smart.<br />
              Collect Four.<br />
              <span className="text-gradient">Win Together.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              A cozy tabletop classic reborn online. Create a private room, invite your friends, and race to gather four matching chits before anyone else.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 hover:scale-[1.03] transition-transform"
              >
                <Link to="/create-room">
                  <Plus className="mr-1.5 h-4 w-4" /> Create Room
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="hover:scale-[1.03] transition-transform"
              >
                <Link to="/join-room">
                  <LogIn className="mr-1.5 h-4 w-4" /> Join Room
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Live rooms
              </div>
              <div>2–4 players</div>
              <div>Free to play</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="relative"
          >
            <div className="glass relative rounded-[2rem] p-2 shadow-glow">
              <img
                src={heroImg}
                alt="Friends gathered around a table playing ChitSet"
                width={1536}
                height={1024}
                className="rounded-[1.65rem] object-cover"
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-6 top-8 hidden rounded-2xl bg-card px-4 py-3 shadow-card sm:block"
              >
                <p className="text-xs text-muted-foreground">Room code</p>
                <p className="font-display text-lg font-bold tracking-widest">CH1T-42</p>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -right-4 hidden rounded-2xl bg-gradient-primary px-4 py-3 text-primary-foreground shadow-glow sm:block"
              >
                <p className="text-xs opacity-80">Players in lobby</p>
                <p className="font-display text-lg font-bold">3 / 4</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

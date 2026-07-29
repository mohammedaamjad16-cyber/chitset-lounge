import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-primary p-10 text-primary-foreground shadow-glow sm:p-16"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Your table is waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base opacity-90 sm:text-lg">
            Round up your friends. Whoever collects four chits first tells the story tomorrow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              <Link to="/create-room">
                <Plus className="mr-1.5 h-4 w-4" /> Create Room
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
              <Link to="/join-room">
                <LogIn className="mr-1.5 h-4 w-4" /> Join Room
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

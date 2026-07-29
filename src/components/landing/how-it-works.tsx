import { motion } from "framer-motion";
import { DoorOpen, Users, Trophy } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";

const STEPS = [
  { icon: DoorOpen, title: "Create or Join", desc: "Spin up a private room in seconds or drop into one with a code." },
  { icon: Users, title: "Wait in the Lobby", desc: "Friends arrive, avatars pop in, everyone gets ready together." },
  { icon: Trophy, title: "Collect Four & Win", desc: "Pass, receive, reveal. The first to collect four matching chits takes the round." },
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-muted/30">
      <SectionHeader
        eyebrow="How it works"
        title="Three steps. That's the whole thing."
        description="No account, no setup, no manual. Just open, invite, play."
      />
      <div className="relative grid gap-6 md:grid-cols-3">
        <div className="pointer-events-none absolute inset-x-6 top-14 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.12 }}
            className="relative rounded-2xl border border-border bg-card p-6 text-center shadow-soft"
          >
            <div className="relative mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <s.icon className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-background text-xs font-bold text-foreground shadow-soft">
                {i + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

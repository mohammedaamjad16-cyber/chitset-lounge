import { motion } from "framer-motion";
import { Zap, Lock, Timer, Brain, GraduationCap, Smartphone } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";

const FEATURES = [
  { icon: Zap, title: "Real-Time Multiplayer", desc: "Every pass, every reveal — synced instantly across every device in the room." },
  { icon: Lock, title: "Private Rooms", desc: "Share a room code with friends. Nobody joins unless you invite them." },
  { icon: Timer, title: "Quick Matches", desc: "One round takes minutes. Perfect for a break, commute, or a lazy afternoon." },
  { icon: Brain, title: "Strategy Based", desc: "Simple rules, deep decisions. Read the table, bluff the pass, collect the set." },
  { icon: GraduationCap, title: "Easy To Learn", desc: "Pick it up in under a minute. Your grandparents can play. So can your cousins." },
  { icon: Smartphone, title: "Cross Device Support", desc: "Phone, tablet, laptop — the experience adapts beautifully everywhere." },
] as const;

export function Features() {
  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Features"
        title={<>Built for friends,<br className="hidden sm:block" /> designed to feel good.</>}
        description="Every detail crafted so your group can focus on the fun, not the interface."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-card"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

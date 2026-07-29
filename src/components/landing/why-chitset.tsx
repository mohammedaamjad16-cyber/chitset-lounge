import { motion } from "framer-motion";
import { Download, Globe, UserPlus, Lock, BookOpen, Swords } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";

const ITEMS = [
  { icon: Download, title: "No Downloads", desc: "Runs in your browser." },
  { icon: Globe, title: "Play Anywhere", desc: "Any device, any network." },
  { icon: UserPlus, title: "Invite Friends", desc: "Share a code and go." },
  { icon: Lock, title: "Private Matches", desc: "Rooms only your crew joins." },
  { icon: BookOpen, title: "Simple Rules", desc: "Learn in under a minute." },
  { icon: Swords, title: "Competitive Fun", desc: "Bragging rights included." },
] as const;

export function WhyChitset() {
  return (
    <Section id="why">
      <SectionHeader
        eyebrow="Why ChitSet"
        title="Small game. Big evenings."
        description="Everything you need for spontaneous game nights with the people you like most."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="glass flex items-start gap-4 rounded-2xl p-5"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

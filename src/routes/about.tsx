import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/shared/section";
import { GlassCard } from "@/components/shared/glass-card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ChitSet — The 4 Chit Game, Reimagined" },
      { name: "description", content: "Learn the story behind ChitSet, a modern browser-based take on the traditional 4 Chit game." },
      { property: "og:title", content: "About ChitSet" },
      { property: "og:description", content: "The story behind ChitSet — a modern take on the 4 Chit game." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <Section>
      <SectionHeader
        eyebrow="About"
        title="A tabletop classic, reborn online."
        description="ChitSet takes the joy of the traditional 4 Chit game — passing folded paper across a table with your friends — and turns it into something you can spin up anywhere, on any device, in seconds."
      />
      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        {[
          { title: "Our mission", body: "Make casual multiplayer games that respect your time and delight the people at your table." },
          { title: "Built for groups", body: "Every design decision starts with the question: does this make it easier to play together?" },
          { title: "No friction", body: "No installs, no accounts, no ads. Just a name, a room code, and your friends." },
          { title: "Always evolving", body: "This is milestone one. Gameplay, tournaments, and new modes are on the roadmap." },
        ].map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <GlassCard className="h-full p-6">
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

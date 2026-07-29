import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhyChitset } from "@/components/landing/why-chitset";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChitSet — Pass Smart. Collect Four. Win Together." },
      { name: "description", content: "A modern real-time multiplayer take on the classic 4 Chit game. Create private rooms, invite friends, and play together in your browser." },
      { property: "og:title", content: "ChitSet — Real-time multiplayer 4 Chit Game" },
      { property: "og:description", content: "Create rooms, invite friends, and collect four chits to win. Free to play in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <WhyChitset />
      <FAQ />
      <CTA />
    </>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Game Table — ChitSet" },
      {
        name: "description",
        content: "The ChitSet game table. Full gameplay, chit distribution and scoring arrive in the next milestone.",
      },
      { property: "og:title", content: "ChitSet Game Table" },
      { property: "og:description", content: "Gameplay arrives in the next milestone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePlaceholder,
});

function GamePlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
        <EmptyState
          icon={Gamepad2}
          title="Gameplay will be implemented in the next milestone."
          description="Chit distribution, turn management, scoring and winner detection are coming soon. Your room is still waiting in the lobby."
          actionLabel="Back to Lobby"
          onAction={() => navigate({ to: "/lobby" })}
        />
      </motion.div>
    </div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import type { Reaction } from "@/lib/chat/use-reactions";

export type { Reaction };

export interface ReactionOverlayProps {
  reactions: Reaction[];
  playerId: string;
}

export function ReactionOverlay({ reactions, playerId }: ReactionOverlayProps) {
  const mine = reactions.filter((r) => r.playerId === playerId);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      <AnimatePresence>
        {mine.map((r) => {
          const drift = (Math.random() - 0.5) * 40;
          return (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -80, x: drift, scale: 1.1 }}
              exit={{ opacity: 0, y: -120, scale: 0.8 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-2xl"
            >
              {r.emoji}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { Eye, Hand, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChitCard } from "./chit-card";
import type { Chit } from "@/lib/game/engine";

interface PlayerHandProps {
  hand: Chit[];
  revealed: Record<string, boolean>;
  selectedId: string | null;
  isMyTurn: boolean;
  canAct: boolean;
  onSelect: (chitId: string) => void;
  onReveal: (chitId: string) => void;
  onRevealAll: () => void;
  onPass: () => void;
  onShow: () => void;
}

export function PlayerHand({
  hand,
  revealed,
  selectedId,
  isMyTurn,
  canAct,
  onSelect,
  onReveal,
  onRevealAll,
  onPass,
  onShow,
}: PlayerHandProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Hand className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="truncate font-display text-sm font-semibold">Your chits</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onRevealAll}>
          <Eye className="mr-1.5 h-4 w-4" /> Unfold all
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {hand.map((chit) => (
            <ChitCard
              key={chit.id}
              chit={chit}
              revealed={Boolean(revealed[chit.id])}
              selected={selectedId === chit.id}
              onClick={() => {
                if (!revealed[chit.id]) onReveal(chit.id);
                onSelect(chit.id);
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <motion.div layout className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          className="min-h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
          disabled={!canAct || !isMyTurn || !selectedId}
          onClick={onPass}
        >
          <Send className="mr-1.5 h-4 w-4" />
          {isMyTurn ? "Pass selected chit" : "Waiting for your turn"}
        </Button>
        <Button
          variant="outline"
          className="min-h-11 border-success/60 text-success hover:bg-success/10"
          disabled={!canAct || !isMyTurn}
          onClick={onShow}
        >
          <Trophy className="mr-1.5 h-4 w-4" /> Show!
        </Button>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        Tap a chit to unfold it, then pass it clockwise. Call <strong>Show</strong> when all four match.
      </p>
    </div>
  );
}

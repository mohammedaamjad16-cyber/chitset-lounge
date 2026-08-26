import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hand, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChitCard } from "./chit-card";
import type { Chit } from "@/lib/game/engine";
import { countByItem, CHITS_PER_PLAYER } from "@/lib/game/engine";
import { useReducedMotionPref } from "@/hooks/use-reduced-motion";

interface PlayerHandProps {
  hand: Chit[];
  revealed: Record<string, boolean>;
  selectedId: string | null;
  isMyTurn: boolean;
  canAct: boolean;
  /** Player already Showed — disable the Show button. */
  hasShown?: boolean;
  /** Increment to shake the hand after a rejected action (e.g. invalid Show). */
  shakeKey?: number;
  onSelect: (chitId: string) => void;
  onReveal: (chitId: string) => void;
  onPass: () => void;
  onShow: () => void;
}

export function PlayerHand({
  hand,
  revealed,
  selectedId,
  isMyTurn,
  canAct,
  hasShown = false,
  shakeKey = 0,
  onSelect,
  onReveal,
  onPass,
  onShow,
}: PlayerHandProps) {
  const reduced = useReducedMotionPref();
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!shakeKey) return;
    setShaking(true);
    const id = setTimeout(() => setShaking(false), 450);
    return () => clearTimeout(id);
  }, [shakeKey]);

  const counts = countByItem(hand);
  const best = Math.max(0, ...Object.values(counts));
  const bestItem = Object.keys(counts).find((k) => counts[k] === best);
  const nearWin = best === CHITS_PER_PLAYER - 1;
  const canWin = best === CHITS_PER_PLAYER;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Hand className="h-4 w-4 shrink-0 text-primary" />
          <h2 className="truncate font-display text-sm font-semibold">Your chits</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            best set {best}/{CHITS_PER_PLAYER}
          </span>
        </div>
      </div>

      {/* Turn state, announced for screen readers too */}
      <div aria-live="polite" className="flex justify-center">
        <AnimatePresence mode="wait">
          {isMyTurn && canAct && (
            <motion.p
              key="your-turn"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={
                reduced
                  ? { opacity: 1 }
                  : { opacity: 1, y: [0, -3, 0] }
              }
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0.2 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              Your turn — pick a chit to pass
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        animate={shaking && !reduced ? { x: [0, -10, 9, -6, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.42 }}
        className="flex flex-wrap justify-center gap-3 sm:gap-4"
      >
        <AnimatePresence mode="popLayout">
          {hand.map((chit) => (
            <ChitCard
              key={chit.id}
              chit={chit}
              revealed={Boolean(revealed[chit.id])}
              selected={selectedId === chit.id}
              highlighted={(nearWin || canWin) && chit.itemId === bestItem}
              onClick={() => {
                if (!revealed[chit.id]) onReveal(chit.id);
                onSelect(chit.id);
              }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.div layout className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          className="min-h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
          disabled={!canAct || !isMyTurn || !selectedId}
          onClick={onPass}
        >
          <Send className="mr-1.5 h-4 w-4" />
          {isMyTurn ? (selectedId ? "Pass selected chit" : "Select a chit") : "Waiting for your turn"}
        </Button>
        <motion.div
          animate={canWin && !reduced ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, repeat: canWin ? Infinity : 0, ease: "easeInOut" }}
        >
          <Button
            variant="outline"
            className="min-h-11 w-full border-success/60 text-success hover:bg-success/10"
            disabled={!canAct || !isMyTurn || hasShown}
            onClick={onShow}
          >
            <Trophy className="mr-1.5 h-4 w-4" /> {hasShown ? "Showed" : "Show!"}
          </Button>
        </motion.div>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        Tap a chit to select it, then pass it clockwise. Call <strong>Show</strong> when all four match.
      </p>
    </div>
  );
}

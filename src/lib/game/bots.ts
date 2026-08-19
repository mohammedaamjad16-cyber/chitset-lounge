import { countByItem, type Chit } from "./engine";

/**
 * Bot decision layer. Bots only ever see their OWN hand — the same information
 * a human player has — and they act through the normal engine actions.
 */

export type BotDifficulty = "easy" | "normal" | "hard";

export const BOT_NAMES = [
  "ChitBot",
  "LuckyBot",
  "PaperBot",
  "FourFinder",
  "QuickChit",
  "ChitMaster",
  "FoldWizard",
  "SetSeeker",
];

/** Realistic thinking delay per difficulty, always inside the turn timer. */
export function botDelayMs(difficulty: BotDifficulty, seed = 0): number {
  const ranges: Record<BotDifficulty, [number, number]> = {
    easy: [2000, 5000],
    normal: [1000, 4000],
    hard: [1000, 3000],
  };
  const [min, max] = ranges[difficulty];
  const jitter = (Math.abs(seed) % 100) / 100;
  return Math.round(min + (max - min) * jitter);
}

/**
 * Which chit the bot gives away.
 * easy   — mostly random, sometimes sensible.
 * normal — passes a chit from its smallest group.
 * hard   — keeps its largest group and breaks ties by holding pairs.
 */
export function botChoosePass(hand: Chit[], difficulty: BotDifficulty): Chit | undefined {
  if (hand.length === 0) return undefined;
  const counts = countByItem(hand);

  if (difficulty === "easy" && Math.random() < 0.55) {
    return hand[Math.floor(Math.random() * hand.length)];
  }

  const ranked = [...hand].sort((a, b) => {
    const diff = counts[a.itemId] - counts[b.itemId];
    if (diff !== 0) return diff;
    return a.itemId.localeCompare(b.itemId);
  });

  if (difficulty === "hard") {
    // Never break the biggest group; drop from the rarest group.
    return ranked[0];
  }

  // Normal: rarest group, with a small chance of a second-best choice.
  if (ranked.length > 1 && Math.random() < 0.2) return ranked[1];
  return ranked[0];
}

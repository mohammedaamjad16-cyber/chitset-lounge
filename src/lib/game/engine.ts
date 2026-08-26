import { getItemsForCategory, type ChitItem } from "./chit-data";

/** A single folded chit on the table. */
export interface Chit {
  id: string;
  itemId: string;
  label: string;
  emoji: string;
}

/** Fisher–Yates — unbiased, fresh arrangement every match. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const CHITS_PER_PLAYER = 4;

/**
 * playerCount distinct items × 4 copies = playerCount × 4 chits.
 * Never duplicated, never missing.
 */
export function generateChits(categoryId: string, playerCount: number): Chit[] {
  const pool = getItemsForCategory(categoryId);
  const picked: ChitItem[] = shuffle(pool).slice(0, playerCount);
  // Safety net for tiny category lists.
  while (picked.length < playerCount) picked.push(pool[picked.length % pool.length]);

  const chits: Chit[] = [];
  picked.forEach((it, itemIndex) => {
    for (let copy = 0; copy < CHITS_PER_PLAYER; copy += 1) {
      chits.push({
        id: `${it.id}-${itemIndex}-${copy}`,
        itemId: it.id,
        label: it.label,
        emoji: it.emoji,
      });
    }
  });
  return shuffle(chits);
}

/** Deal exactly four chits to every player. */
export function dealChits(chits: Chit[], playerIds: string[]): Record<string, Chit[]> {
  const hands: Record<string, Chit[]> = {};
  playerIds.forEach((id, i) => {
    hands[id] = chits.slice(i * CHITS_PER_PLAYER, (i + 1) * CHITS_PER_PLAYER);
  });
  return hands;
}

export function countByItem(hand: Chit[]): Record<string, number> {
  return hand.reduce<Record<string, number>>((acc, c) => {
    acc[c.itemId] = (acc[c.itemId] ?? 0) + 1;
    return acc;
  }, {});
}

/** Any hand with at least four chits of the same name is a winning hand. */
export function isWinningHand(hand: Chit[]): boolean {
  const counts = countByItem(hand);
  return Object.values(counts).some((n) => n >= CHITS_PER_PLAYER);
}

/** Extract exactly four matching chits from a winning hand (the rest are extras). */
export function extractWinningChits(hand: Chit[]): Chit[] {
  const counts = countByItem(hand);
  const winner = Object.entries(counts).find(([, n]) => n >= CHITS_PER_PLAYER)?.[0];
  if (!winner) return [];
  return hand.filter((c) => c.itemId === winner).slice(0, CHITS_PER_PLAYER);
}

/** Which chit a bot (or the auto-timer) should give away: the rarest one. */
export function pickChitToPass(hand: Chit[]): Chit | undefined {
  if (hand.length === 0) return undefined;
  const counts = countByItem(hand);
  const sorted = [...hand].sort((a, b) => counts[a.itemId] - counts[b.itemId]);
  return sorted[0];
}

export function nextTurnIndex(current: number, playerCount: number) {
  return (current + 1) % playerCount;
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

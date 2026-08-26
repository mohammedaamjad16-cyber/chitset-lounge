/** Local match history. Swap the read/write pair for a backend later. */

export interface MatchHistoryEntry {
  id: string;
  winnerName: string;
  categoryName: string;
  winningLabel: string;
  players: string[];
  durationMs: number;
  turns: number;
  playedAt: number;
}

const KEY = "chitset:history";
const MAX_ENTRIES = 20;

export function readHistory(): MatchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as MatchHistoryEntry[];
    // Heal duplicates that may exist from earlier versions.
    const seen = new Set<string>();
    return all.filter((h) => (seen.has(h.id) ? false : seen.add(h.id)));
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: MatchHistoryEntry) {
  if (typeof window === "undefined") return;
  // Upsert by id so remounts / replays of the same match can't create duplicates.
  const next = [entry, ...readHistory().filter((h) => h.id !== entry.id)].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — history is best-effort */
  }
}

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
    return raw ? (JSON.parse(raw) as MatchHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: MatchHistoryEntry) {
  if (typeof window === "undefined") return;
  const next = [entry, ...readHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — history is best-effort */
  }
}

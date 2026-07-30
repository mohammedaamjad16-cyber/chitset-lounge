import { useSyncExternalStore } from "react";

export type PaletteId = "classic" | "midnight" | "forest" | "ocean" | "sunset";

export interface Settings {
  palette: PaletteId;
  soundEnabled: boolean;
  soundVolume: number; // 0..1
  musicEnabled: boolean;
  reducedMotion: boolean;
  chatEnabled: boolean;
  showReactions: boolean;
  confirmLeave: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  palette: "classic",
  soundEnabled: true,
  soundVolume: 0.5,
  musicEnabled: false,
  reducedMotion: false,
  chatEnabled: true,
  showReactions: true,
  confirmLeave: true,
};

export const PALETTES: { id: PaletteId; name: string; swatch: [string, string, string] }[] = [
  { id: "classic", name: "Classic", swatch: ["#4F46E5", "#7C3AED", "#22C55E"] },
  { id: "midnight", name: "Midnight", swatch: ["#3B82F6", "#6366F1", "#38BDF8"] },
  { id: "forest", name: "Forest", swatch: ["#15803D", "#65A30D", "#F59E0B"] },
  { id: "ocean", name: "Ocean", swatch: ["#0891B2", "#0EA5E9", "#14B8A6"] },
  { id: "sunset", name: "Sunset", swatch: ["#EA580C", "#DB2777", "#F59E0B"] },
];

const KEY = "chitset:settings";

let state: Settings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* best effort */
  }
}

export function applyPalette(palette: PaletteId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.palette = palette;
}

export function hydrateSettings() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* ignore corrupt settings */
  }
  applyPalette(state.palette);
  emit();
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  if (patch.palette) applyPalette(patch.palette);
  persist();
  emit();
}

export function getSettings() {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSettings() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => DEFAULT_SETTINGS,
  );
}

import { useSyncExternalStore } from "react";
import type { ChitItem } from "./chit-data";

/**
 * Local "My Categories" store. Shaped like a row so it can move to a backend
 * table later without touching consumers (id, name, description, emoji, names).
 */

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Unique chit names. Each one becomes a full set of four chits. */
  names: string[];
  createdAt: number;
  updatedAt: number;
}

export const CUSTOM_PREFIX = "custom:";
export const MAX_NAME_LEN = 24;
export const MAX_CATEGORY_NAME_LEN = 28;
export const MAX_NAMES = 8;

const KEY = "chitset:custom-categories";

let state: CustomCategory[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* best effort */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw) as CustomCategory[];
  } catch {
    state = [];
  }
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const EMPTY: CustomCategory[] = [];

export function useCustomCategories() {
  return useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return state;
    },
    () => EMPTY,
  );
}

export function getCustomCategories() {
  hydrate();
  return state;
}

export function getCustomCategory(id: string) {
  hydrate();
  const bare = id.startsWith(CUSTOM_PREFIX) ? id.slice(CUSTOM_PREFIX.length) : id;
  return state.find((c) => c.id === bare) ?? null;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export interface CustomCategoryDraft {
  name: string;
  description?: string;
  emoji?: string;
  names: string[];
}

export function saveCustomCategory(draft: CustomCategoryDraft, existingId?: string): CustomCategory {
  hydrate();
  const now = Date.now();
  const cleaned: CustomCategoryDraft = {
    name: draft.name.trim(),
    description: (draft.description ?? "").trim(),
    emoji: (draft.emoji ?? "✨").trim() || "✨",
    names: draft.names.map((n) => n.trim()).filter(Boolean),
  };

  if (existingId) {
    const found = state.find((c) => c.id === existingId);
    if (found) {
      const next: CustomCategory = {
        ...found,
        name: cleaned.name,
        description: cleaned.description ?? "",
        emoji: cleaned.emoji ?? "✨",
        names: cleaned.names,
        updatedAt: now,
      };
      state = state.map((c) => (c.id === existingId ? next : c));
      emit();
      return next;
    }
  }

  const created: CustomCategory = {
    id: uid(),
    name: cleaned.name,
    description: cleaned.description ?? "",
    emoji: cleaned.emoji ?? "✨",
    names: cleaned.names,
    createdAt: now,
    updatedAt: now,
  };
  state = [created, ...state];
  emit();
  return created;
}

export function deleteCustomCategory(id: string) {
  hydrate();
  state = state.filter((c) => c.id !== id);
  emit();
}

export function duplicateCustomCategory(id: string): CustomCategory | null {
  const found = getCustomCategory(id);
  if (!found) return null;
  return saveCustomCategory({
    name: `${found.name} copy`.slice(0, MAX_CATEGORY_NAME_LEN),
    description: found.description,
    emoji: found.emoji,
    names: found.names,
  });
}

/* ------------------------------------------------------------------ */
/* Validation — mirrors the core rule: unique names === player count    */
/* ------------------------------------------------------------------ */

export interface CustomCategoryErrors {
  name?: string;
  names?: string;
  perName: Record<number, string>;
}

export function validateCustomCategory(
  draft: CustomCategoryDraft,
  playerCount?: number,
): CustomCategoryErrors {
  const errors: CustomCategoryErrors = { perName: {} };
  const name = draft.name.trim();

  if (!name) errors.name = "Category name is required.";
  else if (name.length > MAX_CATEGORY_NAME_LEN)
    errors.name = `Keep it under ${MAX_CATEGORY_NAME_LEN} characters.`;

  const seen = new Map<string, number>();
  draft.names.forEach((raw, i) => {
    const value = raw.trim();
    if (!value) {
      errors.perName[i] = "Name required.";
      return;
    }
    if (value.length > MAX_NAME_LEN) {
      errors.perName[i] = `Max ${MAX_NAME_LEN} characters.`;
      return;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) errors.perName[i] = "Duplicate name.";
    else seen.set(key, i);
  });

  const filled = draft.names.filter((n) => n.trim()).length;
  if (filled < 2) errors.names = "Add at least 2 chit names.";
  else if (draft.names.length > MAX_NAMES) errors.names = `Max ${MAX_NAMES} names.`;
  else if (playerCount && filled !== playerCount)
    errors.names = `This room has ${playerCount} players — you need exactly ${playerCount} unique names.`;

  return errors;
}

export function isCustomCategoryValid(errors: CustomCategoryErrors) {
  return !errors.name && !errors.names && Object.keys(errors.perName).length === 0;
}

/** Chit items for a saved custom category (same shape as built-in items). */
export function customChitItems(category: CustomCategory): ChitItem[] {
  return category.names.map((label, i) => ({
    id: `${category.id}-${i}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label,
    emoji: category.emoji || "✨",
  }));
}

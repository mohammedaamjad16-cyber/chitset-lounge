import { useSyncExternalStore } from "react";
import type { CreateRoomInput, Player, RoomState } from "./types";

/**
 * Local, in-memory + localStorage backed room store.
 * Shaped so it can later be swapped for Socket.IO / Supabase Realtime
 * without touching the components that consume it.
 */

const STORAGE_KEY = "chitset:room";

let state: RoomState | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as RoomState;
  } catch {
    state = null;
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => {
  hydrate();
  return state;
};
const getServerSnapshot = () => null;

export function useRoom() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function createRoom(input: CreateRoomInput): RoomState {
  const hostId = uid();
  state = {
    code: generateRoomCode(),
    name: input.roomName,
    hostId,
    maxPlayers: input.maxPlayers,
    categoryId: input.categoryId,
    visibility: input.visibility,
    gameMode: input.gameMode,
    players: [
      { id: hostId, name: input.hostName, isHost: true, isReady: false, connection: "connected" },
    ],
    createdAt: Date.now(),
  };
  emit();
  return state;
}

export function joinRoom(playerName: string, code: string): RoomState {
  if (!state) {
    // No live backend yet — spin up a room shell for the given code.
    const hostId = uid();
    state = {
      code: code.toUpperCase(),
      name: "Friend's Room",
      hostId,
      maxPlayers: 4,
      categoryId: "fruits",
      visibility: "private",
      gameMode: "classic",
      players: [
        { id: hostId, name: "Host", isHost: true, isReady: true, connection: "connected" },
      ],
      createdAt: Date.now(),
    };
  }
  const player: Player = {
    id: uid(),
    name: playerName,
    isHost: false,
    isReady: false,
    connection: "connected",
  };
  state = { ...state, players: [...state.players, player] };
  emit();
  return state;
}

export function toggleReady(playerId: string) {
  if (!state) return;
  state = {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, isReady: !p.isReady } : p)),
  };
  emit();
}

export function updateRoomSettings(
  patch: Partial<Pick<RoomState, "maxPlayers" | "categoryId" | "visibility">>,
) {
  if (!state) return;
  state = { ...state, ...patch };
  emit();
}

export function leaveRoom() {
  state = null;
  emit();
}

/** Identity of the player on this device (until auth exists). */
const ME_KEY = "chitset:me";

export function setMeId(id: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(ME_KEY, id);
}

export function getMeId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ME_KEY);
}

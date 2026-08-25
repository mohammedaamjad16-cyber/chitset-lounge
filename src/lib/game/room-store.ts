import { useSyncExternalStore } from "react";
import type { CreateRoomInput, Player, RoomState, TeamId } from "./types";
import { BOT_NAMES } from "./bots";

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

/** Imperative read for non-reactive callers. */
export function getRoomSnapshot() {
  hydrate();
  return state;
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
    allowBots: input.allowBots ?? true,
    botDifficulty: input.botDifficulty ?? "normal",
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
  if (state.status === "in-game") {
    throw new Error("ROOM_LOCKED");
  }
  if (state.players.length >= state.maxPlayers) {
    throw new Error("ROOM_FULL");
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
  patch: Partial<
    Pick<
      RoomState,
      "maxPlayers" | "categoryId" | "visibility" | "gameMode" | "allowBots" | "botDifficulty"
    >
  >,
) {
  if (!state) return;
  state = { ...state, ...patch };
  emit();
}

/* ------------------------------------------------------------------ */
/* Bots                                                                */
/* ------------------------------------------------------------------ */

/** Seats bots (clearly marked) until the room reaches `target` players. */
export function addBots(target?: number): number {
  if (!state) return 0;
  const seats = Math.min(target ?? state.maxPlayers, state.maxPlayers);
  if (state.players.length >= seats) return 0;
  const taken = new Set(state.players.map((p) => p.name));
  const extras: Player[] = [];
  for (let i = state.players.length; i < seats; i += 1) {
    const name = BOT_NAMES.find((n) => !taken.has(n)) ?? `ChitBot ${i + 1}`;
    taken.add(name);
    extras.push({
      id: uid(),
      name,
      isHost: false,
      isReady: true,
      connection: "connected",
      isBot: true,
      ...(state.gameMode === "team"
        ? { team: ((state.players.length + extras.length) % 2 === 0 ? "A" : "B") as TeamId }
        : {}),
    });
  }
  state = { ...state, players: [...state.players, ...extras] };
  emit();
  return extras.length;
}

export function removeBots() {
  if (!state) return;
  state = { ...state, players: state.players.filter((p) => !p.isBot) };
  emit();
}

/* ------------------------------------------------------------------ */
/* Teams                                                              */
/* ------------------------------------------------------------------ */

export function setPlayerTeam(playerId: string, team: TeamId) {
  if (!state) return;
  state = {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, team } : p)),
  };
  emit();
}

/** Alternating assignment keeps both teams as balanced as possible. */
export function autoBalanceTeams() {
  if (!state) return;
  state = {
    ...state,
    players: state.players.map((p, i) => ({ ...p, team: (i % 2 === 0 ? "A" : "B") as TeamId })),
  };
  emit();
}

export function clearTeams() {
  if (!state) return;
  state = { ...state, players: state.players.map(({ team: _team, ...p }) => p) };
  emit();
}

const SIM_NAMES = ["Rahul", "Meera", "Kabir", "Ananya", "Vikram", "Zoya"];

/**
 * Until a live socket backend exists, empty seats are filled with simulated
 * opponents so a full match can always be played.
 */
export function fillWithSimulatedPlayers(target?: number) {
  if (!state) return;
  const seats = Math.min(target ?? state.maxPlayers, state.maxPlayers);
  if (state.players.length >= seats) return;
  const extras: Player[] = [];
  for (let i = state.players.length; i < seats; i += 1) {
    extras.push({
      id: uid(),
      name: SIM_NAMES[i % SIM_NAMES.length],
      isHost: false,
      isReady: true,
      connection: "connected",
      isBot: true,
      ...(state.gameMode === "team" ? { team: (i % 2 === 0 ? "A" : "B") as TeamId } : {}),
    });
  }
  state = { ...state, players: [...state.players, ...extras] };
  emit();
}

export function setRoomStatus(status: "lobby" | "in-game") {
  if (!state) return;
  state = { ...state, status };
  emit();
}

export function isRoomLocked() {
  return state?.status === "in-game";
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

/* ------------------------------------------------------------------ */
/* Online mode — the realtime layer pushes authoritative room state    */
/* ------------------------------------------------------------------ */

const ONLINE_KEY = "chitset:online";

/** Replace the whole room state (used by the realtime sync layer). */
export function setRoom(next: RoomState | null) {
  hydrate();
  state = next;
  emit();
}

export function setOnlineMode(online: boolean) {
  if (typeof window === "undefined") return;
  if (online) window.localStorage.setItem(ONLINE_KEY, "1");
  else window.localStorage.removeItem(ONLINE_KEY);
}

export function isOnlineMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONLINE_KEY) === "1";
}

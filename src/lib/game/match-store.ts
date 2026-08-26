import { useSyncExternalStore } from "react";
import type { RoomState, TeamId } from "./types";
import { botChoosePass, botDelayMs, type BotDifficulty } from "./bots";
import { playCue } from "@/lib/audio/audio-manager";
import {
  dealChits,
  generateChits,
  isWinningHand,
  nextTurnIndex,
  pickChitToPass,
  type Chit,
} from "./engine";

/**
 * Local match store. Same shape a Socket.IO / Realtime channel would push,
 * so components never need to change when a server is introduced.
 */

export type MatchPhase = "dealing" | "playing" | "passing" | "finished";

export interface MatchPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  team?: TeamId;
}

export interface PassInFlight {
  chit: Chit;
  fromId: string;
  toId: string;
  at: number;
}

export interface LogEntry {
  id: string;
  text: string;
  at: number;
}

export interface MatchState {
  roomCode: string;
  roomName: string;
  categoryId: string;
  players: MatchPlayer[];
  hands: Record<string, Chit[]>;
  revealed: Record<string, boolean>;
  turnIndex: number;
  turnStartedAt: number;
  turnDurationMs: number;
  phase: MatchPhase;
  pass: PassInFlight | null;
  turns: number;
  startedAt: number;
  endedAt: number | null;
  winnerId: string | null;
  winningChits: Chit[];
  invalidShowAt: number | null;
  /** Who attempted the rejected show — drives the shake feedback. */
  invalidShowBy?: string | null;
  gameMode?: RoomState["gameMode"];
  botDifficulty: BotDifficulty;
  log: LogEntry[];
}

export const TURN_DURATION_MS = 8000;
const PASS_FLIGHT_MS = 620;
const STORAGE_KEY = "chitset:match";

let state: MatchState | null = null;
let hydrated = false;
let ticker: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();
const uid = () => Math.random().toString(36).slice(2, 10);

function persist() {
  if (typeof window === "undefined") return;
  try {
    if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* best effort */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
  if (net?.isHost) net.broadcast(state);
}

/* ------------------------------------------------------------------ */
/* Network transport — host authoritative, guests apply snapshots      */
/* ------------------------------------------------------------------ */

export interface MatchTransport {
  isHost: boolean;
  broadcast: (state: MatchState | null) => void;
}

let net: MatchTransport | null = null;

export function setMatchTransport(transport: MatchTransport | null) {
  net = transport;
}

export function getMatchTransport() {
  return net;
}

/** Apply an authoritative snapshot received from the host. */
export function applyMatchSnapshot(next: MatchState | null) {
  hydrated = true;
  state = next;
  persist();
  listeners.forEach((l) => l());
}

/** Imperative read for non-reactive callers. */
export function getMatchSnapshot() {
  hydrate();
  return state;
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw) as MatchState;
      // A restored match resumes from a fresh turn clock.
      if (state && state.phase !== "finished") {
        state = { ...state, phase: "playing", pass: null, turnStartedAt: Date.now() };
      }
    }
  } catch {
    state = null;
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  ensureTicker();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => {
  hydrate();
  return state;
};
const getServerSnapshot = () => null;

export function useMatch() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function log(text: string) {
  if (!state) return;
  state = {
    ...state,
    log: [{ id: uid(), text, at: Date.now() }, ...state.log].slice(0, 30),
  };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function startMatch(
  room: RoomState,
  meId: string | null,
  options: { bots?: boolean } = {},
) {
  // Offline play still needs opponents that act, so unknown seats fall back to
  // bot control — but only when there is no realtime transport, otherwise the
  // authority would start playing remote humans' hands. Explicitly seated bots
  // are always bot-controlled.
  const autoFill = options.bots ?? true;
  const players: MatchPlayer[] = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isBot: p.isBot === true || (!net && autoFill && p.id !== meId),
    connected: p.connection !== "disconnected",
    team: p.team,
  }));

  const chits = generateChits(room.categoryId, players.length);
  const hands = dealChits(chits, players.map((p) => p.id));

  // Chits land face-up — nobody should have to tap four times just to read
  // their hand. (Passed chits still arrive folded and auto-flip on landing.)
  const revealed: Record<string, boolean> = {};
  Object.values(hands).forEach((hand) => hand.forEach((c) => { revealed[c.id] = true; }));

  state = {
    roomCode: room.code,
    roomName: room.name,
    categoryId: room.categoryId,
    players,
    hands,
    revealed,
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDurationMs: TURN_DURATION_MS,
    phase: "dealing",
    pass: null,
    turns: 0,
    startedAt: Date.now(),
    endedAt: null,
    winnerId: null,
    winningChits: [],
    invalidShowAt: null,
    invalidShowBy: null,
    gameMode: room.gameMode,
    botDifficulty: room.botDifficulty ?? "normal",
    log: [{ id: uid(), text: "Chits shuffled and dealt.", at: Date.now() }],
  };
  emit();
  playCue("shuffle");
  ensureTicker();
  return state;
}

export function beginPlay() {
  if (!state || state.phase !== "dealing") return;
  state = { ...state, phase: "playing", turnStartedAt: Date.now() };
  log(`${currentPlayer()?.name ?? "Player"} starts the round.`);
  emit();
  playCue("gameStart");
}

export function revealChit(chitId: string) {
  if (!state) return;
  state = { ...state, revealed: { ...state.revealed, [chitId]: true } };
  emit();
}

export function revealAll(playerId: string) {
  if (!state) return;
  const revealed = { ...state.revealed };
  (state.hands[playerId] ?? []).forEach((c) => {
    revealed[c.id] = true;
  });
  state = { ...state, revealed };
  emit();
}

export function currentPlayer(): MatchPlayer | undefined {
  return state?.players[state.turnIndex];
}

export function passChit(playerId: string, chitId: string) {
  if (!state || state.phase !== "playing") return;
  const active = state.players[state.turnIndex];
  if (!active || active.id !== playerId) return;

  const hand = state.hands[playerId] ?? [];
  const chit = hand.find((c) => c.id === chitId);
  if (!chit) return;

  const toId = state.players[nextTurnIndex(state.turnIndex, state.players.length)].id;

  state = {
    ...state,
    phase: "passing",
    pass: { chit, fromId: playerId, toId, at: Date.now() },
    hands: { ...state.hands, [playerId]: hand.filter((c) => c.id !== chitId) },
  };
  emit();
}

function completePass() {
  if (!state || !state.pass) return;
  const { chit, toId, fromId } = state.pass;
  const receiver = [...(state.hands[toId] ?? []), chit];
  const revealed = { ...state.revealed };
  delete revealed[chit.id]; // arrives folded for the receiver

  state = {
    ...state,
    hands: { ...state.hands, [toId]: receiver },
    revealed,
    pass: null,
    phase: "playing",
    turns: state.turns + 1,
    turnIndex: nextTurnIndex(state.turnIndex, state.players.length),
    turnStartedAt: Date.now(),
  };

  const from = state.players.find((p) => p.id === fromId);
  const to = state.players.find((p) => p.id === toId);
  log(`${from?.name ?? "Player"} passed a chit to ${to?.name ?? "Player"}.`);
  emit();
}

export function callShow(playerId: string): { ok: boolean; reason?: string } {
  if (!state || state.phase !== "playing") return { ok: false, reason: "The table isn't ready." };
  const hand = state.hands[playerId] ?? [];

  if (!isWinningHand(hand)) {
    state = { ...state, invalidShowAt: Date.now(), invalidShowBy: playerId };
    const who = state.players.find((p) => p.id === playerId);
    log(`${who?.name ?? "Player"} called SHOW — not four matching chits.`);
    emit();
    return { ok: false, reason: "Your four chits are not identical." };
  }

  finish(playerId, hand);
  return { ok: true };
}

function finish(winnerId: string, hand: Chit[]) {
  if (!state) return;
  const revealed = { ...state.revealed };
  hand.forEach((c) => {
    revealed[c.id] = true;
  });
  const winner = state.players.find((p) => p.id === winnerId);
  state = {
    ...state,
    phase: "finished",
    pass: null,
    revealed,
    winnerId,
    winningChits: hand,
    endedAt: Date.now(),
  };
  log(`${winner?.name ?? "Player"} wins with four ${hand[0]?.label ?? "chits"}!`);
  emit();
  stopTicker();
}

export function clearInvalidShow() {
  if (!state?.invalidShowAt) return;
  state = { ...state, invalidShowAt: null, invalidShowBy: null };
  emit();
}

export function endMatch() {
  state = null;
  emit();
  stopTicker();
}

/* ------------------------------------------------------------------ */
/* Driver — turn timer + simulated opponents                           */
/* ------------------------------------------------------------------ */

function autoPass(playerId: string) {
  if (!state) return;
  const chit = pickChitToPass(state.hands[playerId] ?? []);
  if (chit) passChit(playerId, chit.id);
}

/** A bot decides using only its own hand, then acts through the normal action. */
function botPass(playerId: string, difficulty: BotDifficulty) {
  if (!state) return;
  const chit = botChoosePass(state.hands[playerId] ?? [], difficulty);
  if (chit) passChit(playerId, chit.id);
}

function tick() {
  if (!state) {
    // Nothing to drive — release the interval so an abandoned match can't tick forever.
    stopTicker();
    return;
  }
  // Only the authority drives the clock; guests render host snapshots.
  if (net && !net.isHost) return;
  const now = Date.now();

  if (state.phase === "dealing") {
    if (now - state.startedAt > 1400) beginPlay();
    return;
  }

  if (state.phase === "passing" && state.pass) {
    if (now - state.pass.at >= PASS_FLIGHT_MS) completePass();
    return;
  }

  if (state.phase !== "playing") return;

  const active = state.players[state.turnIndex];
  if (!active) return;
  const elapsed = now - state.turnStartedAt;

  // A simulated opponent may claim a valid show.
  if (active.isBot && isWinningHand(state.hands[active.id] ?? []) && elapsed > 900) {
    finish(active.id, state.hands[active.id]);
    return;
  }

  if (active.isBot) {
    const difficulty = state.botDifficulty ?? "normal";
    const think = Math.min(
      state.turnDurationMs - 600,
      botDelayMs(difficulty, active.id.charCodeAt(0) * 7 + active.id.length * 13),
    );
    if (elapsed > think) {
      botPass(active.id, difficulty);
      return;
    }
  }

  // Timer expiry — a random chit leaves the hand automatically.
  if (elapsed >= state.turnDurationMs) {
    const hand = state.hands[active.id] ?? [];
    const random = hand[Math.floor(Math.random() * hand.length)];
    log(`${active.name} ran out of time — a chit was passed automatically.`);
    playCue("timerExpire");
    if (random) passChit(active.id, random.id);
  }
}

function ensureTicker() {
  if (ticker || typeof window === "undefined") return;
  ticker = setInterval(() => {
    tick();
    // Keep countdown UIs smooth even when no state transition happened.
    if (state && state.phase !== "finished") listeners.forEach((l) => l());
  }, 120);
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

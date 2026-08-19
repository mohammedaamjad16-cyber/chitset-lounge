import { getSettings } from "@/lib/settings/settings-store";

/**
 * Centralised audio manager. Every sound in the app goes through `playCue`.
 * Cues are synthesised with the Web Audio API so no binary assets ship with the
 * bundle — drop in real samples by adding a URL to SAMPLE_SOURCES and the
 * manager prefers it over the synth tone.
 *
 * Nothing plays until the user interacts with the page (`unlockAudio`), which
 * keeps browser autoplay policies happy.
 */

export type SoundCue =
  | "click"
  | "select"
  | "flip"
  | "pass"
  | "receive"
  | "deal"
  | "shuffle"
  | "turnStart"
  | "timerWarning"
  | "timerExpire"
  | "message"
  | "reaction"
  | "join"
  | "leave"
  | "achievement"
  | "gameStart"
  | "show"
  | "invalidShow"
  | "winner"
  | "matchEnd"
  | "notify"
  | "error";

const SAMPLE_SOURCES: Partial<Record<SoundCue, string>> = {};

interface Tone {
  freq: number;
  to?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

const TONES: Record<SoundCue, Tone[]> = {
  click: [{ freq: 620, duration: 0.05, type: "triangle", gain: 0.25 }],
  select: [{ freq: 540, to: 780, duration: 0.08, type: "triangle", gain: 0.22 }],
  flip: [{ freq: 380, to: 720, duration: 0.12, type: "triangle" }],
  pass: [{ freq: 300, to: 540, duration: 0.16, type: "sine" }],
  receive: [{ freq: 520, to: 340, duration: 0.16, type: "sine", gain: 0.24 }],
  deal: [
    { freq: 240, to: 420, duration: 0.09, type: "sine" },
    { freq: 300, to: 500, duration: 0.09, type: "sine" },
  ],
  shuffle: [
    { freq: 200, to: 360, duration: 0.07, type: "triangle", gain: 0.16 },
    { freq: 260, to: 420, duration: 0.07, type: "triangle", gain: 0.16 },
    { freq: 220, to: 380, duration: 0.07, type: "triangle", gain: 0.16 },
  ],
  turnStart: [{ freq: 520, to: 780, duration: 0.14, type: "sine" }],
  timerWarning: [{ freq: 880, duration: 0.09, type: "square", gain: 0.18 }],
  timerExpire: [{ freq: 660, to: 300, duration: 0.2, type: "square", gain: 0.18 }],
  message: [{ freq: 700, to: 900, duration: 0.08, type: "sine", gain: 0.2 }],
  reaction: [{ freq: 900, to: 1200, duration: 0.1, type: "triangle", gain: 0.18 }],
  join: [{ freq: 480, to: 760, duration: 0.16, type: "sine" }],
  leave: [{ freq: 500, to: 260, duration: 0.18, type: "sine" }],
  achievement: [
    { freq: 660, duration: 0.1, type: "triangle" },
    { freq: 880, duration: 0.1, type: "triangle" },
    { freq: 1180, duration: 0.2, type: "triangle" },
  ],
  gameStart: [
    { freq: 392, duration: 0.12, type: "triangle" },
    { freq: 523, duration: 0.12, type: "triangle" },
    { freq: 659, duration: 0.2, type: "triangle" },
  ],
  show: [
    { freq: 700, to: 1040, duration: 0.14, type: "triangle" },
    { freq: 1040, duration: 0.16, type: "triangle" },
  ],
  invalidShow: [{ freq: 320, to: 180, duration: 0.24, type: "sawtooth", gain: 0.2 }],
  winner: [
    { freq: 523, duration: 0.12, type: "triangle" },
    { freq: 659, duration: 0.12, type: "triangle" },
    { freq: 784, duration: 0.12, type: "triangle" },
    { freq: 1046, duration: 0.28, type: "triangle" },
  ],
  matchEnd: [
    { freq: 660, duration: 0.14, type: "sine" },
    { freq: 440, duration: 0.22, type: "sine" },
  ],
  notify: [{ freq: 760, to: 980, duration: 0.09, type: "sine", gain: 0.18 }],
  error: [{ freq: 300, to: 160, duration: 0.22, type: "sawtooth", gain: 0.2 }],
};

/** Per-cue throttle so re-renders can never stack the same sound. */
const THROTTLE_MS: Partial<Record<SoundCue, number>> = {
  click: 60,
  select: 60,
  flip: 60,
  pass: 120,
  receive: 120,
  message: 200,
  reaction: 150,
  timerWarning: 700,
  notify: 250,
  error: 300,
};
const DEFAULT_THROTTLE_MS = 90;
const lastPlayed = new Map<SoundCue, number>();

let ctx: AudioContext | null = null;
let unlocked = false;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Call once from a user gesture so browsers allow playback. */
export function unlockAudio() {
  unlocked = true;
  audioContext();
  syncMusic();
}

export function isAudioUnlocked() {
  return unlocked;
}

/** Effective sound-effects gain after master volume and mute. */
function sfxVolume() {
  const s = getSettings();
  if (s.muteAll || !s.soundEnabled) return 0;
  return Math.max(0, Math.min(1, s.masterVolume * s.soundVolume));
}

function musicVolume() {
  const s = getSettings();
  if (s.muteAll || !s.musicEnabled) return 0;
  return Math.max(0, Math.min(1, s.masterVolume * s.musicVolume));
}

function playTones(tones: Tone[], volume: number) {
  const context = audioContext();
  if (!context) return;
  let start = context.currentTime;
  for (const tone of tones) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.duration);
    const peak = (tone.gain ?? 0.3) * volume;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + tone.duration + 0.02);
    start += tone.duration * 0.85;
  }
}

export function playCue(cue: SoundCue) {
  if (typeof window === "undefined") return;
  const volume = sfxVolume();
  if (volume <= 0) return;

  const now = Date.now();
  const gap = THROTTLE_MS[cue] ?? DEFAULT_THROTTLE_MS;
  if (now - (lastPlayed.get(cue) ?? 0) < gap) return;
  lastPlayed.set(cue, now);

  const sample = SAMPLE_SOURCES[cue];
  if (sample) {
    try {
      const audio = new Audio(sample);
      audio.volume = volume;
      void audio.play();
      return;
    } catch {
      /* fall through to synth */
    }
  }

  try {
    playTones(TONES[cue], volume);
  } catch {
    /* audio unavailable — game stays playable */
  }
}

/* ------------------------------------------------------------------ */
/* Background music — a gentle synthesised loop, no assets required    */
/* ------------------------------------------------------------------ */

const CHORDS: number[][] = [
  [174.61, 261.63, 329.63],
  [196.0, 293.66, 349.23],
  [155.56, 233.08, 311.13],
  [146.83, 220.0, 293.66],
];

interface MusicHandle {
  master: GainNode;
  oscs: OscillatorNode[];
  timer: ReturnType<typeof setInterval>;
}

let music: MusicHandle | null = null;
let chordIndex = 0;

export function isMusicPlaying() {
  return music !== null;
}

function startMusicInternal() {
  const context = audioContext();
  if (!context || music) return;
  const master = context.createGain();
  master.gain.value = musicVolume() * 0.12;
  master.connect(context.destination);

  const oscs = [0, 1, 2].map(() => {
    const osc = context.createOscillator();
    osc.type = "sine";
    const g = context.createGain();
    g.gain.value = 0.34;
    osc.connect(g).connect(master);
    osc.start();
    return osc;
  });

  const applyChord = () => {
    const chord = CHORDS[chordIndex % CHORDS.length];
    chordIndex += 1;
    const t = context.currentTime;
    oscs.forEach((osc, i) => {
      osc.frequency.setTargetAtTime(chord[i] ?? chord[0], t, 0.9);
    });
  };
  applyChord();
  const timer = setInterval(applyChord, 6000);
  music = { master, oscs, timer };
}

function stopMusicInternal() {
  if (!music) return;
  clearInterval(music.timer);
  try {
    music.master.gain.setTargetAtTime(0, music.master.context.currentTime, 0.3);
    const handle = music;
    setTimeout(() => {
      handle.oscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      });
      handle.master.disconnect();
    }, 700);
  } catch {
    /* ignore */
  }
  music = null;
}

/** Align the music engine with the current settings + unlock state. */
export function syncMusic() {
  if (typeof window === "undefined") return;
  const volume = musicVolume();
  if (!unlocked || volume <= 0) {
    stopMusicInternal();
    return;
  }
  if (!music) startMusicInternal();
  else music.master.gain.setTargetAtTime(volume * 0.12, music.master.context.currentTime, 0.2);
}

export function toggleMusic(on: boolean) {
  if (on) syncMusic();
  else stopMusicInternal();
}

/** Release every audio resource (called on unmount / page teardown). */
export function disposeAudio() {
  stopMusicInternal();
  lastPlayed.clear();
}

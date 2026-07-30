import { getSettings } from "@/lib/settings/settings-store";

/**
 * Lightweight audio manager. Cues are synthesised with the Web Audio API so no
 * binary assets ship with the bundle — drop in real samples by adding a URL to
 * SAMPLE_SOURCES and the manager will prefer it over the synth tone.
 */

export type SoundCue =
  | "click"
  | "flip"
  | "pass"
  | "deal"
  | "turnStart"
  | "timerWarning"
  | "message"
  | "reaction"
  | "join"
  | "leave"
  | "achievement"
  | "winner"
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
  flip: [{ freq: 380, to: 720, duration: 0.12, type: "triangle" }],
  pass: [{ freq: 300, to: 540, duration: 0.16, type: "sine" }],
  deal: [
    { freq: 240, to: 420, duration: 0.09, type: "sine" },
    { freq: 300, to: 500, duration: 0.09, type: "sine" },
  ],
  turnStart: [{ freq: 520, to: 780, duration: 0.14, type: "sine" }],
  timerWarning: [{ freq: 880, duration: 0.09, type: "square", gain: 0.18 }],
  message: [{ freq: 700, to: 900, duration: 0.08, type: "sine", gain: 0.2 }],
  reaction: [{ freq: 900, to: 1200, duration: 0.1, type: "triangle", gain: 0.18 }],
  join: [{ freq: 480, to: 760, duration: 0.16, type: "sine" }],
  leave: [{ freq: 500, to: 260, duration: 0.18, type: "sine" }],
  achievement: [
    { freq: 660, duration: 0.1, type: "triangle" },
    { freq: 880, duration: 0.1, type: "triangle" },
    { freq: 1180, duration: 0.2, type: "triangle" },
  ],
  winner: [
    { freq: 523, duration: 0.12, type: "triangle" },
    { freq: 659, duration: 0.12, type: "triangle" },
    { freq: 784, duration: 0.12, type: "triangle" },
    { freq: 1046, duration: 0.28, type: "triangle" },
  ],
  error: [{ freq: 300, to: 160, duration: 0.22, type: "sawtooth", gain: 0.2 }],
};

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call once from a user gesture so browsers allow playback. */
export function unlockAudio() {
  audioContext();
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
  const { soundEnabled, soundVolume } = getSettings();
  if (!soundEnabled || soundVolume <= 0 || typeof window === "undefined") return;

  const sample = SAMPLE_SOURCES[cue];
  if (sample) {
    try {
      const audio = new Audio(sample);
      audio.volume = soundVolume;
      void audio.play();
      return;
    } catch {
      /* fall through to synth */
    }
  }

  try {
    playTones(TONES[cue], soundVolume);
  } catch {
    /* audio unavailable — game stays playable */
  }
}

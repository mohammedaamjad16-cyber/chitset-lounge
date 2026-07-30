import { useCallback } from "react";

/**
 * Sound placeholders. No audio assets are bundled yet — each cue is a no-op
 * hook point so real samples can be dropped in without touching game code.
 */
export type SoundCue =
  | "click"
  | "flip"
  | "pass"
  | "turnStart"
  | "timerWarning"
  | "winner"
  | "error";

const SOUND_SOURCES: Record<SoundCue, string | null> = {
  click: null,
  flip: null,
  pass: null,
  turnStart: null,
  timerWarning: null,
  winner: null,
  error: null,
};

export function useGameSound() {
  const play = useCallback((cue: SoundCue) => {
    const src = SOUND_SOURCES[cue];
    if (!src || typeof window === "undefined") return;
    try {
      const audio = new Audio(src);
      audio.volume = 0.4;
      void audio.play();
    } catch {
      /* autoplay blocked — silent by design */
    }
  }, []);

  return { play };
}

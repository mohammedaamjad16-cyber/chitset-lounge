import { useCallback } from "react";
import { playCue, unlockAudio, type SoundCue } from "@/lib/audio/audio-manager";

export type { SoundCue };

/** Thin hook over the audio manager, kept for existing gameplay call sites. */
export function useGameSound() {
  const play = useCallback((cue: SoundCue) => playCue(cue), []);
  return { play, unlock: unlockAudio };
}

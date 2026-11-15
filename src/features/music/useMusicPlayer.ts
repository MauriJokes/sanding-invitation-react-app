import { useState } from "react";

export interface MusicPlayer {
  playing: boolean;
  toggle: () => void;
}

/**
 * Placeholder until the owner supplies the track (step 6e): it only tracks the visible state and plays nothing.
 * The real player replaces this hook; the control that uses it does not change.
 */
export function useMusicPlayer(): MusicPlayer {
  const [playing, setPlaying] = useState(false);
  return { playing, toggle: () => setPlaying((p) => !p) };
}

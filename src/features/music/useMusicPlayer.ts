import { useCallback, useEffect, useRef, useState } from "react";
import { MUSIC_SRC, MUSIC_VOLUME } from "./track";

export interface MusicPlayer {
  playing: boolean;
  /** The track could not be loaded or played. The page is unaffected; the control just says so. */
  unavailable: boolean;
  toggle: () => void;
}

/**
 * One looping track with an explicit play/pause control. Nothing is requested until the first press, and playback only
 * ever starts from that press (a user gesture), so browser autoplay rules are never worked around.
 */
export function useMusicPlayer(src: string = MUSIC_SRC): MusicPlayer {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [],
  );

  const toggle = useCallback(() => {
    if (!audio.current) {
      const el = new Audio();
      el.preload = "none";
      el.loop = true;
      el.volume = MUSIC_VOLUME;
      el.addEventListener("play", () => setPlaying(true));
      el.addEventListener("pause", () => setPlaying(false));
      el.addEventListener("error", () => {
        setPlaying(false);
        setUnavailable(true);
      });
      el.src = src;
      audio.current = el;
    }
    const el = audio.current;
    if (!el.paused) {
      el.pause();
      return;
    }
    // play() rejects when the file is missing or the browser refuses; neither may disturb the page.
    el.play().catch(() => {
      setPlaying(false);
      setUnavailable(true);
    });
  }, [src]);

  return { playing, unavailable, toggle };
}

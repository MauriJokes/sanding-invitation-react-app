import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, 1000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/** The current time in whole seconds, refreshed every second and when the tab becomes visible again. */
const snapshot = (): number => Math.floor(Date.now() / 1000) * 1000;

export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

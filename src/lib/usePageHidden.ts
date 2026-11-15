import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** True while the tab is in the background, so decorative animation can pause. */
export function usePageHidden(): boolean {
  return useSyncExternalStore(subscribe, () => document.hidden, () => false);
}

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

/** Copies text to the clipboard and reports the result for a few seconds. A missing or refused clipboard is "failed", never an error. */
export function useCopy(text: string, resetMs = 2500): { state: CopyState; copy: () => void } {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(() => {
    const finish = (result: CopyState) => {
      setState(result);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), resetMs);
    };
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== "function") {
      finish("failed");
      return;
    }
    clipboard.writeText(text).then(
      () => finish("copied"),
      () => finish("failed"),
    );
  }, [text, resetMs]);

  return { state, copy };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicGuestbookEntry } from "../../../shared/guestbook/constants";
import { fetchGuestbookPage } from "./api";

export type GuestbookListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; entries: PublicGuestbookEntry[]; nextCursor: string | null; loadingMore: boolean; moreFailed: boolean };

/** The newest page, plus older pages on request. Public entries only; the server never sends anything else. */
export function useGuestbookList() {
  const [state, setState] = useState<GuestbookListState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  /** Bumped on every reload so a slow "load more" from before cannot be appended to a fresh list. */
  const generation = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const mine = ++generation.current;
    void (async () => {
      const result = await fetchGuestbookPage(undefined, controller.signal);
      if (controller.signal.aborted || mine !== generation.current) return;
      setState(
        result.ok
          ? { status: "ready", entries: result.data.entries, nextCursor: result.data.nextCursor, loadingMore: false, moreFailed: false }
          : { status: "error" },
      );
    })();
    return () => controller.abort();
  }, [nonce]);

  /** `silent` keeps the current list on screen while the newest page is fetched again (after a new wish). */
  const reload = useCallback((options?: { silent?: boolean }) => {
    if (!options?.silent) setState({ status: "loading" });
    setNonce((n) => n + 1);
  }, []);

  const loadMore = useCallback(async (cursor: string) => {
    const mine = generation.current;
    setState((s) => (s.status === "ready" ? { ...s, loadingMore: true, moreFailed: false } : s));
    const result = await fetchGuestbookPage(cursor);
    if (mine !== generation.current) return;
    setState((s) => {
      if (s.status !== "ready") return s;
      return result.ok
        ? { status: "ready", entries: [...s.entries, ...result.data.entries], nextCursor: result.data.nextCursor, loadingMore: false, moreFailed: false }
        : { ...s, loadingMore: false, moreFailed: true };
    });
  }, []);

  return { state, reload, loadMore };
}

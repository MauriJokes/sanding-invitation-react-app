import { useCallback, useEffect, useState } from "react";
import { MAX_ATTENDEES } from "../../../shared/rsvp/constants";
import { fetchRsvpConfig } from "./api";
import { clearInvite, storeInvite } from "./invite";

export type RsvpConfigState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      maxAttendees: number;
      rsvpOpen: boolean;
      /** The invite, only when the server accepted it. Otherwise undefined and the clean-link limit applies. */
      invite: string | undefined;
    };

/**
 * Asks the server which limit applies. The server is the only judge of the invite: an accepted one is
 * remembered for later visits, a rejected one is forgotten, and a wrong or stale one silently means "2".
 */
export function useRsvpConfig(candidate: string | undefined): {
  state: RsvpConfigState;
  /** `silent` keeps the current form on screen while the limit is refreshed. */
  reload: (options?: { silent?: boolean }) => void;
} {
  const [state, setState] = useState<RsvpConfigState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const result = await fetchRsvpConfig(candidate, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.ok) {
        setState({ status: "error" });
        return;
      }
      const internal = result.data.maxAttendees > MAX_ATTENDEES.external;
      if (candidate) {
        if (internal) storeInvite(candidate);
        else clearInvite();
      }
      setState({
        status: "ready",
        maxAttendees: result.data.maxAttendees,
        rsvpOpen: result.data.rsvpOpen,
        invite: internal ? candidate : undefined,
      });
    })();
    return () => controller.abort();
  }, [candidate, nonce]);

  const reload = useCallback((options?: { silent?: boolean }) => {
    if (!options?.silent) setState({ status: "loading" });
    setNonce((n) => n + 1);
  }, []);

  return { state, reload };
}

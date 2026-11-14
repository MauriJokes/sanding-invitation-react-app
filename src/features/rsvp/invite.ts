import { INVITE_MAX_LENGTH } from "../../../shared/rsvp/constants";

export const INVITE_STORAGE_KEY = "sanding.invite";
const INVITE_PARAM = "invite";
/** The server only issues URL-safe codes, so anything else cannot be valid and is never sent. */
const INVITE_SHAPE = new RegExp(`^[A-Za-z0-9_-]{1,${INVITE_MAX_LENGTH}}$`);

export const isPlausibleInvite = (value: unknown): value is string =>
  typeof value === "string" && INVITE_SHAPE.test(value);

interface UrlLocation {
  href: string;
}
interface UrlHistory {
  state: unknown;
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
}

/**
 * Reads `?invite=` and removes it from the address bar straight away (other parameters and the hash
 * are kept). Returns the value only if it could be a real code. Call once, before React renders.
 */
export function consumeInviteFromUrl(location: UrlLocation, history: UrlHistory): string | undefined {
  const url = new URL(location.href);
  if (!url.searchParams.has(INVITE_PARAM)) return undefined;
  const value = url.searchParams.get(INVITE_PARAM);
  url.searchParams.delete(INVITE_PARAM);
  history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
  return isPlausibleInvite(value) ? value : undefined;
}

/** Storage can be missing or throw (private mode, blocked cookies); the invite is a convenience, so never fail. */
function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredInvite(storage: Storage | undefined = safeStorage()): string | undefined {
  try {
    const value = storage?.getItem(INVITE_STORAGE_KEY);
    return isPlausibleInvite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function storeInvite(invite: string, storage: Storage | undefined = safeStorage()): void {
  try {
    storage?.setItem(INVITE_STORAGE_KEY, invite);
  } catch {
    /* ignore */
  }
}

export function clearInvite(storage: Storage | undefined = safeStorage()): void {
  try {
    storage?.removeItem(INVITE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** URL value wins over a stored one. Runs once at startup. */
export function resolveInvite(location: UrlLocation, history: UrlHistory): string | undefined {
  return consumeInviteFromUrl(location, history) ?? readStoredInvite();
}

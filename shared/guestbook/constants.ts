/** Dependency-free guestbook constants and helpers shared by the browser and the server. */

// Technical bounds (not business rules): see docs/OPEN_DECISIONS.md D-30.
export const DISPLAY_NAME_MAX = 60;
export const MESSAGE_MIN = 1;
export const MESSAGE_MAX = 500;
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 50;

/** Bots fill every text input they find; real guests never see this one (it is hidden from sight and from assistive tech). */
export const HONEYPOT_FIELD = "homepage";

/** `<createdAt in ms>_<24 hex characters of the entry id>`. Opaque to clients. */
export const CURSOR_PATTERN = /^\d{10,14}_[0-9a-f]{24}$/;

export function normalizeDisplayName(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/gu, " ").trim();
}

/** Keeps line breaks (at most one blank line in a row); collapses other whitespace. */
export function normalizeMessage(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/gu, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Control, format (zero-width, bidi) and similar characters; a name may contain none of them. */
export const hasDisallowedNameCharacters = (value: string): boolean => /\p{C}/u.test(value);
/** The same, except that line breaks are allowed in a message. */
export const hasDisallowedMessageCharacters = (value: string): boolean => /(?!\n)\p{C}/u.test(value);

/** What the public sees. Nothing else is ever returned for an entry. */
export interface PublicGuestbookEntry {
  displayName: string;
  message: string;
  createdAt: string;
}

export interface GuestbookPage {
  entries: PublicGuestbookEntry[];
  /** Pass back as `cursor` to get the next, older page; null when there are no more. */
  nextCursor: string | null;
}

export interface GuestbookSubmitted {
  /** True when the entry is shown publicly. Anonymous entries are saved for the couple only. */
  published: boolean;
}

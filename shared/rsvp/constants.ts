/** Dependency-free RSVP constants and helpers shared by the browser and the server. */
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const GUEST_TYPES = ["internal", "external"] as const;
export type GuestType = (typeof GUEST_TYPES)[number];

export const RSVP_STATUSES = ["attending", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

/** Approved by the owner: internal (valid invite) 10, external 2. */
export const MAX_ATTENDEES: Record<GuestType, number> = {
  internal: 10,
  external: 2,
};

// Technical bounds (not business rules): see docs/OPEN_DECISIONS.md D-26.
export const FAMILY_NAME_MIN = 2;
export const FAMILY_NAME_MAX = 100;
export const INVITE_MAX_LENGTH = 128;

/** Longest accepted input, spaces and dashes included. A normalized E.164 number is at most 16 characters. */
export const PHONE_NUMBER_MAX = 20;

/** Trim, collapse whitespace and compose Unicode (NFC). Case is preserved for display. */
export function normalizeFamilyName(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/gu, " ").trim();
}
/**
 * Normalize a phone number into E.164 format (e.g. +6738123456).
 * Returns null if it is invalid. The country code (leading "+") is required.
 */
export function normalizePhoneNumber(raw: string): string | null {
  const value = raw.normalize("NFC").trim();

  if (!value || !value.startsWith("+")) return null;

  const phoneNumber = parsePhoneNumberFromString(value);

  if (!phoneNumber?.isValid()) return null;

  return phoneNumber.number;
}

/** Control, format (zero-width, bidi) and similar characters would defeat duplicate detection. */
export const nameHasDisallowedCharacters = (value: string): boolean =>
  /\p{C}/u.test(value);

export const phoneNumberHasDisallowedCharacters = (value: string): boolean =>
  /[\p{C}]/u.test(value) || /[^0-9+\-()\s]/.test(value);

export interface RsvpConfigResponse {
  maxAttendees: number;
  rsvpOpen: boolean;
}

export interface RsvpSubmittedResponse {
  status: RsvpStatus;
  attendeeCount: number;
}

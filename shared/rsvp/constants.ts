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

/** The only countries the couple's guests are expected to call from; the owner chose Brunei and Malaysia. */
export const PHONE_COUNTRIES = [
  { code: "BN", dialCode: "673", name: "Brunei", example: "812 3456" },
  { code: "MY", dialCode: "60", name: "Malaysia", example: "12 345 6789" },
] as const;
export type PhoneCountryCode = (typeof PHONE_COUNTRIES)[number]["code"];
export const DEFAULT_PHONE_COUNTRY: PhoneCountryCode = "BN";

const isAllowedPhoneCountry = (
  code: string | undefined,
): code is PhoneCountryCode =>
  PHONE_COUNTRIES.some((country) => country.code === code);

/**
 * Normalize a phone number into E.164 format (e.g. +6738123456), or return null.
 * With `country` (the browser form), the value is a national number of that country, so a "+" is
 * rejected and a leading trunk "0" is accepted. Without it (the API), the leading "+" and country
 * code are required. Either way the number must be valid and belong to Brunei or Malaysia.
 */
export function normalizePhoneNumber(
  raw: string,
  country?: PhoneCountryCode,
): string | null {
  const value = raw.normalize("NFC").trim();
  if (!value) return null;

  let parsed;
  if (country) {
    if (value.includes("+")) return null;
    parsed = parsePhoneNumberFromString(value, country);
  } else {
    if (!value.startsWith("+")) return null;
    parsed = parsePhoneNumberFromString(value);
  }

  if (!parsed?.isValid() || !isAllowedPhoneCountry(parsed.country)) return null;
  return parsed.number;
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

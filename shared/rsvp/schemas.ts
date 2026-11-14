import { z } from "zod";

export const GUEST_TYPES = ["internal", "external"] as const;
export type GuestType = (typeof GUEST_TYPES)[number];

export const RSVP_STATUSES = ["attending", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

/** Approved by the owner: internal (valid invite) 10, external 2. */
export const MAX_ATTENDEES: Record<GuestType, number> = { internal: 10, external: 2 };

// Technical bounds (not business rules): see docs/OPEN_DECISIONS.md D-26.
export const FAMILY_NAME_MIN = 2;
export const FAMILY_NAME_MAX = 100;
export const INVITE_MAX_LENGTH = 128;

/** Trim, collapse whitespace and compose Unicode (NFC). Case is preserved for display. */
export function normalizeFamilyName(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/gu, " ").trim();
}

const familyGroupName = z
  .string()
  .max(FAMILY_NAME_MAX * 4)
  .transform(normalizeFamilyName)
  .pipe(
    z
      .string()
      .min(FAMILY_NAME_MIN)
      .max(FAMILY_NAME_MAX)
      // Control, format (zero-width, bidi) and similar characters would defeat duplicate detection.
      .refine((value) => !/\p{C}/u.test(value)),
  );

/**
 * Unknown keys (for example a client-sent `guestType` or limit) are stripped, never trusted.
 * Whether `attendeeCount` is allowed depends on the server-verified guest type, so it is
 * range-checked by the service, not here.
 */
export const rsvpRequestSchema = z.object({
  familyGroupName,
  status: z.enum(RSVP_STATUSES),
  attendeeCount: z.number().int().min(0).max(100),
  invite: z.string().max(INVITE_MAX_LENGTH).optional(),
});
export type RsvpRequest = z.infer<typeof rsvpRequestSchema>;

export const rsvpConfigRequestSchema = z.object({
  invite: z.string().max(INVITE_MAX_LENGTH).optional(),
});
export type RsvpConfigRequest = z.infer<typeof rsvpConfigRequestSchema>;

export interface RsvpConfigResponse {
  maxAttendees: number;
  rsvpOpen: boolean;
}

export interface RsvpSubmittedResponse {
  status: RsvpStatus;
  attendeeCount: number;
}

import { z } from "zod";

import {
  FAMILY_NAME_MAX,
  FAMILY_NAME_MIN,
  INVITE_MAX_LENGTH,
  RSVP_STATUSES,
  hasDisallowedCharacters,
  normalizeFamilyName,
} from "./constants.js";

export * from "./constants.js";

const familyGroupName = z
  .string()
  .max(FAMILY_NAME_MAX * 4)
  .transform(normalizeFamilyName)
  .pipe(
    z
      .string()
      .min(FAMILY_NAME_MIN)
      .max(FAMILY_NAME_MAX)
      .refine((value) => !hasDisallowedCharacters(value)),
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

import { z } from "zod";

import {
  FAMILY_NAME_MAX,
  FAMILY_NAME_MIN,
  INVITE_MAX_LENGTH,
  PHONE_NUMBER_MAX,
  RSVP_STATUSES,
  nameHasDisallowedCharacters,
  normalizeFamilyName,
  normalizePhoneNumber,
  phoneNumberHasDisallowedCharacters,
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
      .refine((value) => !nameHasDisallowedCharacters(value)),
  );

/** Stored only in E.164 form for a Brunei (+673) or Malaysian (+60) number; the client's formatting is never trusted. */
const phoneNumber = z
  .string()
  .max(PHONE_NUMBER_MAX)
  .refine((value) => !phoneNumberHasDisallowedCharacters(value))
  // Wrapped so zod's refinement context is not passed as the country argument.
  .transform((value) => normalizePhoneNumber(value))
  .pipe(z.string());

/**
 * Unknown keys (for example a client-sent `guestType` or limit) are stripped, never trusted.
 * Whether `attendeeCount` is allowed depends on the server-verified guest type, so it is
 * range-checked by the service, not here.
 */
export const rsvpRequestSchema = z.object({
  familyGroupName,
  phoneNumber,
  status: z.enum(RSVP_STATUSES),
  attendeeCount: z.number().int().min(0).max(100),
  invite: z.string().max(INVITE_MAX_LENGTH).optional(),
});
export type RsvpRequest = z.infer<typeof rsvpRequestSchema>;

export const rsvpConfigRequestSchema = z.object({
  invite: z.string().max(INVITE_MAX_LENGTH).optional(),
});
export type RsvpConfigRequest = z.infer<typeof rsvpConfigRequestSchema>;

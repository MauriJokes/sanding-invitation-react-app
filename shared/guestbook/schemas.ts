import { z } from "zod";
import {
  CURSOR_PATTERN,
  DISPLAY_NAME_MAX,
  HONEYPOT_FIELD,
  MESSAGE_MAX,
  MESSAGE_MIN,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  hasDisallowedMessageCharacters,
  hasDisallowedNameCharacters,
  normalizeDisplayName,
  normalizeMessage,
} from "./constants.js";

export * from "./constants.js";

const displayName = z
  .string()
  .max(DISPLAY_NAME_MAX * 4)
  .transform(normalizeDisplayName)
  .pipe(
    z
      .string()
      .max(DISPLAY_NAME_MAX)
      .refine((value) => !hasDisallowedNameCharacters(value)),
  )
  .optional();

const message = z
  .string()
  .max(MESSAGE_MAX * 4)
  .transform(normalizeMessage)
  .pipe(
    z
      .string()
      .min(MESSAGE_MIN)
      .max(MESSAGE_MAX)
      .refine((value) => !hasDisallowedMessageCharacters(value)),
  );

/**
 * A blank or missing name, or `anonymous: true`, makes the entry anonymous: saved and mirrored for the couple,
 * never shown publicly. Unknown keys are stripped. The honeypot is checked by the service, not here, so a bot
 * is not told which field gave it away.
 */
export const guestbookRequestSchema = z.object({
  displayName,
  anonymous: z.boolean().optional(),
  message,
  [HONEYPOT_FIELD]: z.string().max(200).optional(),
});
export type GuestbookRequest = z.infer<typeof guestbookRequestSchema>;

export const guestbookQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
  cursor: z.string().regex(CURSOR_PATTERN).optional(),
});
export type GuestbookQuery = z.infer<typeof guestbookQuerySchema>;

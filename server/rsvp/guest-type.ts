import { createHash, timingSafeEqual } from "node:crypto";
import type { GuestType } from "../../shared/rsvp/schemas.js";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Constant-time comparison (fixed-length digests) of the submitted invite with the server secret.
 * Anything other than an exact match, including a missing, empty or rotated invite, is "external".
 */
export function deriveGuestType(invite: string | undefined, expected: string): GuestType {
  if (!invite || !expected) return "external";
  return timingSafeEqual(digest(invite), digest(expected)) ? "internal" : "external";
}

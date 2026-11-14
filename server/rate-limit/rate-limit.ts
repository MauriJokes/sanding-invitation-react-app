import { createHmac } from "node:crypto";
import { MongoServerError, type Db } from "mongodb";
import { rateLimitsCollection } from "../db/collections.js";
import { AppError } from "../http/errors.js";

export interface RateLimitPolicy {
  scope: string;
  limit: number;
  windowSeconds: number;
}

/** Raw IPs are never stored: keys use a salted HMAC of the client IP. */
export function hashClientIp(ip: string, salt: string): string {
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

const isDuplicateKey = (error: unknown) => error instanceof MongoServerError && error.code === 11000;

/**
 * Fixed-window counter in MongoDB (`rateLimits`, TTL-indexed on `expiresAt`).
 * Best-effort abuse control, not authentication. Throws 429 with Retry-After when exceeded.
 */
export async function enforceRateLimit(
  db: Db,
  policy: RateLimitPolicy,
  ip: string,
  salt: string,
  now: Date,
): Promise<void> {
  const windowMs = policy.windowSeconds * 1000;
  const windowIndex = Math.floor(now.getTime() / windowMs);
  const windowEnd = (windowIndex + 1) * windowMs;
  const id = `${policy.scope}:${hashClientIp(ip, salt)}:${windowIndex}`;

  let count: number | undefined;
  // Two first requests can race on the upsert; the loser retries and increments.
  for (let attempt = 0; attempt < 3 && count === undefined; attempt++) {
    try {
      const doc = await rateLimitsCollection(db).findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowEnd) } },
        { upsert: true, returnDocument: "after" },
      );
      count = doc?.count;
    } catch (error) {
      if (!isDuplicateKey(error) || attempt === 2) throw error;
    }
  }

  if (count === undefined || count > policy.limit) {
    const retryAfter = Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000));
    throw new AppError("RATE_LIMITED", 429, "Too many requests. Please try again later.", {
      headers: { "Retry-After": String(retryAfter) },
    });
  }
}

import type { Db } from "mongodb";
import { COLLECTIONS } from "./collections.js";

/**
 * The only place indexes are defined. Run via `npm run db:indexes`; never on a request.
 * Safe to re-run: identical definitions are a no-op, conflicting ones fail loudly.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  await db.collection(COLLECTIONS.rsvps).createIndexes([
    { key: { canonicalGroupKey: 1 }, name: "canonicalGroupKey_unique", unique: true },
    {
      key: { sheetStatus: 1 },
      name: "sheetStatus_pending",
      partialFilterExpression: { sheetStatus: "pending" },
    },
  ]);
  await db
    .collection(COLLECTIONS.rateLimits)
    .createIndex({ expiresAt: 1 }, { name: "expiresAt_ttl", expireAfterSeconds: 0 });
}

interface IndexInfo {
  key?: unknown;
  unique?: unknown;
  partialFilterExpression?: unknown;
}

/**
 * True only for a full (not partial) unique index on exactly `canonicalGroupKey`. A non-unique or partial
 * index on the same field would let duplicate families through, so it does not count.
 */
export function hasUniqueCanonicalKeyIndex(indexes: readonly IndexInfo[]): boolean {
  return indexes.some(
    (index) =>
      index.unique === true &&
      index.partialFilterExpression === undefined &&
      JSON.stringify(index.key) === JSON.stringify({ canonicalGroupKey: 1 }),
  );
}

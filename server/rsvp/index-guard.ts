import { MongoServerError, type Db, type Document } from "mongodb";
import { rsvpsCollection } from "../db/collections.js";
import { hasUniqueCanonicalKeyIndex } from "../db/indexes.js";
import { AppError } from "../http/errors.js";

/** Re-checked this often per warm instance, so an index dropped later is noticed within minutes. */
export const INDEX_RECHECK_MS = 10 * 60 * 1000;
const NAMESPACE_NOT_FOUND = 26;

const verifiedUntil = new Map<string, number>();

/**
 * The unique `canonicalGroupKey` index is the only duplicate guard. If it is missing (a database that
 * `npm run db:indexes` was never run against), refuse to take RSVPs instead of silently accepting duplicates.
 * Only reads index metadata: no extra permission, nothing is created. A failure is never cached, so running
 * `npm run db:indexes` fixes it without a redeploy.
 */
export async function requireRsvpIndexes(db: Db, now: Date): Promise<void> {
  const until = verifiedUntil.get(db.databaseName);
  if (until !== undefined && now.getTime() < until) return;

  let indexes: Document[] = [];
  try {
    indexes = await rsvpsCollection(db).indexes();
  } catch (error) {
    // A collection that does not exist yet has no indexes.
    if (!(error instanceof MongoServerError && error.code === NAMESPACE_NOT_FOUND)) throw error;
  }

  if (!hasUniqueCanonicalKeyIndex(indexes)) {
    verifiedUntil.delete(db.databaseName);
    console.error(JSON.stringify({ event: "api_error", detail: "missing_index:rsvps.canonicalGroupKey_unique" }));
    throw new AppError("SERVICE_NOT_READY", 503, "This service is not available right now. Please try again later.");
  }
  verifiedUntil.set(db.databaseName, now.getTime() + INDEX_RECHECK_MS);
}

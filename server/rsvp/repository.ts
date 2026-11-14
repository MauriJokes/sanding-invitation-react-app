import { MongoServerError, type Db } from "mongodb";
import { rsvpsCollection, type RsvpDocument } from "../db/collections.js";

export class DuplicateRsvpError extends Error {
  constructor() {
    super("Duplicate RSVP");
    this.name = "DuplicateRsvpError";
  }
}

export interface RsvpRepository {
  /** Insert-only. Throws DuplicateRsvpError when the canonical family/group already exists. */
  insert(doc: Omit<RsvpDocument, "_id">): Promise<void>;
}

const hitsCanonicalKey = (error: MongoServerError) =>
  (error.keyPattern as Record<string, unknown> | undefined)?.canonicalGroupKey !== undefined;

export function createRsvpRepository(db: Db): RsvpRepository {
  return {
    async insert(doc) {
      try {
        await rsvpsCollection(db).insertOne({ ...doc });
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000 && hitsCanonicalKey(error)) {
          throw new DuplicateRsvpError();
        }
        throw error;
      }
    },
  };
}

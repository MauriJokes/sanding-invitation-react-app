import { ObjectId, type Db } from "mongodb";
import { guestbookCollection, type GuestbookDocument } from "../db/collections.js";

export interface PublicRow {
  id: ObjectId;
  displayName: string;
  message: string;
  createdAt: Date;
}

export interface GuestbookRepository {
  insert(doc: Omit<GuestbookDocument, "_id">): Promise<ObjectId>;
  /** Public entries only, newest first. `before` is the position of the last entry already shown. */
  listPublic(params: { limit: number; before?: { createdAtMs: number; id: string } }): Promise<PublicRow[]>;
}

export function createGuestbookRepository(db: Db): GuestbookRepository {
  const entries = guestbookCollection(db);
  return {
    async insert(doc) {
      const { insertedId } = await entries.insertOne({ ...doc });
      return insertedId;
    },

    async listPublic({ limit, before }) {
      const filter = before
        ? {
            isPublic: true,
            $or: [
              { createdAt: { $lt: new Date(before.createdAtMs) } },
              { createdAt: new Date(before.createdAtMs), _id: { $lt: new ObjectId(before.id) } },
            ],
          }
        : { isPublic: true };
      const docs = await entries
        .find(filter, { projection: { displayName: 1, message: 1, createdAt: 1 } })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .toArray();
      return docs.map((doc) => ({
        id: doc._id,
        displayName: doc.displayName ?? "",
        message: doc.message,
        createdAt: doc.createdAt,
      }));
    },
  };
}

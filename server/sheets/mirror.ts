import type { Db, ObjectId } from "mongodb";
import { guestbookCollection, rsvpsCollection, type GuestbookDocument, type RsvpDocument } from "../db/collections.js";
import { getSheetsApi, getWorksheetNames } from "./client.js";
import { GUESTBOOK_HEADERS, RSVP_HEADERS, guestbookRow, rsvpRow } from "./rows.js";
import { writeThrough } from "./write-through.js";

/** Appends the new RSVP to its worksheet, then marks it synced. Never throws. */
export function mirrorRsvp(db: Db, id: ObjectId, doc: RsvpDocument): Promise<"synced" | "pending"> {
  return writeThrough(
    () => getSheetsApi().appendRows({ name: getWorksheetNames().rsvp, headers: RSVP_HEADERS }, [rsvpRow(id.toHexString(), doc)]),
    async () => {
      await rsvpsCollection(db).updateOne({ _id: id }, { $set: { sheetStatus: "synced", sheetSyncedAt: new Date() } });
    },
  );
}

export function mirrorGuestbookEntry(db: Db, id: ObjectId, doc: GuestbookDocument): Promise<"synced" | "pending"> {
  return writeThrough(
    () =>
      getSheetsApi().appendRows({ name: getWorksheetNames().guestbook, headers: GUESTBOOK_HEADERS }, [
        guestbookRow(id.toHexString(), doc),
      ]),
    async () => {
      await guestbookCollection(db).updateOne({ _id: id }, { $set: { sheetStatus: "synced", sheetSyncedAt: new Date() } });
    },
  );
}

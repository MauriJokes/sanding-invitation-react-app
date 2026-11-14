import type { Db, ObjectId } from "mongodb";
import { COLLECTIONS, guestbookCollection, rsvpsCollection } from "../db/collections.js";
import type { SheetsApi } from "./client.js";
import { GUESTBOOK_HEADERS, RSVP_HEADERS, guestbookRow, rsvpRow, type SheetValue, type WorksheetSpec } from "./rows.js";

export const BACKFILL_BATCH_SIZE = 200;
export const BACKFILL_MAX_PER_RUN = 1000;

interface PendingRow {
  id: ObjectId;
  row: SheetValue[];
}

/** One mirrored collection: how to read its pending documents as rows and how to mark them synced. */
interface Source {
  label: string;
  sheet: WorksheetSpec;
  findPending(limit: number): Promise<PendingRow[]>;
  countPending(): Promise<number>;
  oldestPending(): Promise<Date | undefined>;
  markSynced(ids: ObjectId[], now: Date): Promise<void>;
}

export function sources(db: Db, names: { rsvp: string; guestbook: string }): Source[] {
  const rsvps = rsvpsCollection(db);
  const guestbook = guestbookCollection(db);
  return [
    {
      label: COLLECTIONS.rsvps,
      sheet: { name: names.rsvp, headers: RSVP_HEADERS },
      async findPending(limit) {
        const docs = await rsvps.find({ sheetStatus: "pending" }).sort({ createdAt: 1, _id: 1 }).limit(limit).toArray();
        return docs.map((doc) => ({ id: doc._id, row: rsvpRow(doc._id.toHexString(), doc) }));
      },
      countPending: () => rsvps.countDocuments({ sheetStatus: "pending" }),
      async oldestPending() {
        return (await rsvps.find({ sheetStatus: "pending" }).sort({ createdAt: 1 }).limit(1).next())?.createdAt;
      },
      async markSynced(ids, now) {
        await rsvps.updateMany({ _id: { $in: ids } }, { $set: { sheetStatus: "synced", sheetSyncedAt: now } });
      },
    },
    {
      label: COLLECTIONS.guestbookEntries,
      sheet: { name: names.guestbook, headers: GUESTBOOK_HEADERS },
      async findPending(limit) {
        const docs = await guestbook.find({ sheetStatus: "pending" }).sort({ createdAt: 1, _id: 1 }).limit(limit).toArray();
        return docs.map((doc) => ({ id: doc._id, row: guestbookRow(doc._id.toHexString(), doc) }));
      },
      countPending: () => guestbook.countDocuments({ sheetStatus: "pending" }),
      async oldestPending() {
        return (await guestbook.find({ sheetStatus: "pending" }).sort({ createdAt: 1 }).limit(1).next())?.createdAt;
      },
      async markSynced(ids, now) {
        await guestbook.updateMany({ _id: { $in: ids } }, { $set: { sheetStatus: "synced", sheetSyncedAt: now } });
      },
    },
  ];
}

export interface PendingReport {
  label: string;
  pending: number;
  oldest: Date | undefined;
}

/** Read-only, MongoDB only. */
export async function checkPending(db: Db, names: { rsvp: string; guestbook: string }): Promise<PendingReport[]> {
  return Promise.all(
    sources(db, names).map(async (source) => ({
      label: source.label,
      pending: await source.countPending(),
      oldest: await source.oldestPending(),
    })),
  );
}

export interface BackfillReport {
  label: string;
  pending: number;
  appended: number;
  alreadyPresent: number;
  remaining: number;
  failed: boolean;
}

/**
 * Appends every pending document to its worksheet, oldest first, skipping ids already in the sheet (a lost
 * response after a successful append must not create a duplicate row), then marks them synced.
 * Idempotent: running it twice appends nothing the second time.
 */
export async function backfill(
  db: Db,
  api: SheetsApi,
  names: { rsvp: string; guestbook: string },
  now: Date = new Date(),
): Promise<BackfillReport[]> {
  const reports: BackfillReport[] = [];
  for (const source of sources(db, names)) {
    const report: BackfillReport = { label: source.label, pending: 0, appended: 0, alreadyPresent: 0, remaining: 0, failed: false };
    reports.push(report);
    try {
      const pending = await source.findPending(BACKFILL_MAX_PER_RUN);
      report.pending = pending.length;
      if (pending.length === 0) continue;

      const present = await api.listIds(source.sheet);
      const missing = pending.filter((item) => !present.has(item.id.toHexString()));
      const already = pending.filter((item) => present.has(item.id.toHexString()));

      if (already.length > 0) {
        await source.markSynced(already.map((item) => item.id), now);
        report.alreadyPresent = already.length;
      }
      for (let start = 0; start < missing.length; start += BACKFILL_BATCH_SIZE) {
        const batch = missing.slice(start, start + BACKFILL_BATCH_SIZE);
        await api.appendRows(source.sheet, batch.map((item) => item.row));
        await source.markSynced(batch.map((item) => item.id), now);
        report.appended += batch.length;
      }
    } catch {
      report.failed = true;
    }
    report.remaining = await source.countPending();
  }
  return reports;
}

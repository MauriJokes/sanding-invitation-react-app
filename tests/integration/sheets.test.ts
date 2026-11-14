import { afterEach, describe, expect, it, vi } from "vitest";
import rsvpRoute from "../../api/rsvp/index";
import guestbookRoute from "../../api/guestbook/index";
import { COLLECTIONS, type GuestbookDocument, type RsvpDocument } from "../../server/db/collections";
import { SheetsError } from "../../server/sheets/client";
import { BACKFILL_BATCH_SIZE, backfill, checkPending } from "../../server/sheets/backfill";
import { fakeSheets } from "../fake-sheets";
import { TEST_INVITE, postJson, useTestDatabase } from "./helpers";

const { db } = useTestDatabase();
const NAMES = { rsvp: "Family RSVP", guestbook: "Guestbook" };

afterEach(() => vi.restoreAllMocks());
const quiet = () => vi.spyOn(console, "error").mockImplementation(() => undefined);

const rsvp = (over: Record<string, unknown> = {}) => ({ familyGroupName: "The Lim Family", status: "attending", attendeeCount: 2, ...over });
const rsvps = async () => (await db()).collection<RsvpDocument>(COLLECTIONS.rsvps).find().sort({ createdAt: 1 }).toArray();
const wishes = async () => (await db()).collection<GuestbookDocument>(COLLECTIONS.guestbookEntries).find().sort({ createdAt: 1 }).toArray();

describe("RSVP write-through", () => {
  it("appends the documented row, marks the RSVP synced and still answers 201 with only the confirmation", async () => {
    const res = await postJson(rsvpRoute, rsvp({ familyGroupName: "  The   Lim Family " }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: { status: "attending", attendeeCount: 2 }, error: null });

    const [doc] = await rsvps();
    expect(doc).toMatchObject({ sheetStatus: "synced" });
    const row = fakeSheets.rows("Family RSVP")[0] ?? [];
    expect(row).toHaveLength(6);
    expect(row[0]).toBe(doc?._id.toHexString());
    expect(row[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
    expect(row.slice(2)).toEqual(["The Lim Family", "external", "attending", 2]);
  });

  it("mirrors the derived guest type for an internal guest and never the invite code", async () => {
    await postJson(rsvpRoute, rsvp({ attendeeCount: 8, invite: TEST_INVITE }));
    const row = fakeSheets.rows("Family RSVP")[0] ?? [];
    expect(row[3]).toBe("internal");
    expect(JSON.stringify(fakeSheets.rows("Family RSVP"))).not.toContain(TEST_INVITE);
  });

  it("mirrors a declined RSVP with zero attendees", async () => {
    await postJson(rsvpRoute, rsvp({ status: "declined", attendeeCount: 0 }));
    expect((fakeSheets.rows("Family RSVP")[0] ?? []).slice(4)).toEqual(["declined", 0]);
  });

  it("keeps the RSVP and answers 201 when Google is down; the document stays pending", async () => {
    quiet();
    fakeSheets.failWith = new SheetsError("http", 503);
    const res = await postJson(rsvpRoute, rsvp());
    expect(res.status).toBe(201);
    expect((await rsvps())[0]).toMatchObject({ sheetStatus: "pending" });
    expect(fakeSheets.rows("Family RSVP")).toHaveLength(0);
  });

  it("does not mirror a rejected duplicate or an over-limit RSVP", async () => {
    await postJson(rsvpRoute, rsvp());
    expect((await postJson(rsvpRoute, rsvp({ familyGroupName: "the lim family" }))).status).toBe(409);
    expect((await postJson(rsvpRoute, rsvp({ familyGroupName: "Other", attendeeCount: 3 }))).status).toBe(400);
    expect(fakeSheets.rows("Family RSVP")).toHaveLength(1);
  });

  it("appends one row per family when many submit at once", async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => postJson(rsvpRoute, rsvp({ familyGroupName: `Family ${i}` }))));
    expect(responses.every((r) => r.status === 201)).toBe(true);
    expect(fakeSheets.rows("Family RSVP")).toHaveLength(12);
    expect(new Set(fakeSheets.rows("Family RSVP").map((r) => r[0])).size).toBe(12);
  });

  it("keeps a failed Sheets append from affecting the duplicate guard", async () => {
    quiet();
    fakeSheets.failWith = new SheetsError("network");
    await postJson(rsvpRoute, rsvp());
    fakeSheets.failWith = undefined;
    expect((await postJson(rsvpRoute, rsvp())).status).toBe(409);
    expect(await rsvps()).toHaveLength(1);
  });
});

describe("backfill", () => {
  async function submitWhileDown(rsvpCount: number, wishCount: number) {
    quiet();
    fakeSheets.failWith = new SheetsError("http", 500);
    for (let i = 0; i < rsvpCount; i++) await postJson(rsvpRoute, rsvp({ familyGroupName: `Family ${i}` }));
    for (let i = 0; i < wishCount; i++) {
      await postJson(guestbookRoute, { displayName: i % 2 ? "" : `Guest ${i}`, message: `Wish ${i}` }, undefined, "/api/guestbook");
    }
    fakeSheets.failWith = undefined;
    fakeSheets.reset();
  }

  it("reports pending rows read-only, without touching Sheets or the data", async () => {
    await submitWhileDown(2, 3);
    const report = await checkPending(await db(), NAMES);
    expect(report.map((r) => [r.label, r.pending])).toEqual([["rsvps", 2], ["guestbookEntries", 3]]);
    expect(report[0]?.oldest).toBeInstanceOf(Date);
    expect(fakeSheets.appendCalls).toBe(0);
    expect((await rsvps()).every((d) => d.sheetStatus === "pending")).toBe(true);
  });

  it("appends every pending row once, oldest first, and marks them synced", async () => {
    await submitWhileDown(3, 2);
    const reports = await backfill(await db(), fakeSheets, NAMES);
    expect(reports.map((r) => [r.label, r.appended, r.alreadyPresent, r.remaining, r.failed])).toEqual([
      ["rsvps", 3, 0, 0, false],
      ["guestbookEntries", 2, 0, 0, false],
    ]);
    expect(fakeSheets.rows("Family RSVP").map((r) => r[2])).toEqual(["Family 0", "Family 1", "Family 2"]);
    expect(fakeSheets.rows("Guestbook").map((r) => r[4])).toEqual(["Wish 0", "Wish 1"]);
    expect((await rsvps()).every((d) => d.sheetStatus === "synced" && d.sheetSyncedAt instanceof Date)).toBe(true);
    expect((await wishes()).every((d) => d.sheetStatus === "synced")).toBe(true);
  });

  it("is idempotent: a second run appends nothing", async () => {
    await submitWhileDown(2, 2);
    await backfill(await db(), fakeSheets, NAMES);
    const before = fakeSheets.appendCalls;
    const again = await backfill(await db(), fakeSheets, NAMES);
    expect(again.every((r) => r.pending === 0 && r.appended === 0)).toBe(true);
    expect(fakeSheets.appendCalls).toBe(before);
    expect(fakeSheets.rows("Family RSVP")).toHaveLength(2);
  });

  it("never duplicates a row whose append succeeded but whose response was lost", async () => {
    await submitWhileDown(2, 0);
    const [first] = await rsvps();
    fakeSheets.seed("Family RSVP", [first?._id.toHexString() ?? "", "t", "Family 0", "external", "attending", 2]);

    const [report] = await backfill(await db(), fakeSheets, NAMES);
    expect(report).toMatchObject({ appended: 1, alreadyPresent: 1, remaining: 0 });
    expect(fakeSheets.rows("Family RSVP")).toHaveLength(2);
    expect(new Set(fakeSheets.rows("Family RSVP").map((r) => r[0])).size).toBe(2);
    expect((await rsvps()).every((d) => d.sheetStatus === "synced")).toBe(true);
  });

  it("leaves rows pending and reports failure when Google is still down, then recovers on the next run", async () => {
    await submitWhileDown(2, 1);
    fakeSheets.failWith = new SheetsError("http", 503);
    const down = await backfill(await db(), fakeSheets, NAMES);
    expect(down.every((r) => r.failed)).toBe(true);
    expect(down.map((r) => r.remaining)).toEqual([2, 1]);

    fakeSheets.failWith = undefined;
    const up = await backfill(await db(), fakeSheets, NAMES);
    expect(up.every((r) => !r.failed && r.remaining === 0)).toBe(true);
    expect(fakeSheets.rows("Family RSVP")).toHaveLength(2);
  });

  it("sends large backlogs in batches, each a single atomic append", async () => {
    const col = (await db()).collection<GuestbookDocument>(COLLECTIONS.guestbookEntries);
    const total = BACKFILL_BATCH_SIZE * 2 + 5;
    await col.insertMany(
      Array.from({ length: total }, (_, i) => ({ message: `m${i}`, isPublic: false, createdAt: new Date(1_790_000_000_000 + i), sheetStatus: "pending" as const })),
    );
    const reports = await backfill(await db(), fakeSheets, NAMES);
    expect(reports.find((r) => r.label === "guestbookEntries")).toMatchObject({ appended: total, remaining: 0 });
    expect(fakeSheets.appendCalls).toBe(3);
    expect(fakeSheets.rows("Guestbook").map((r) => r[4])).toEqual(Array.from({ length: total }, (_, i) => `m${i}`));
  });

  it("does nothing, and asks Google nothing, when no rows are pending", async () => {
    const reports = await backfill(await db(), fakeSheets, NAMES);
    expect(reports.every((r) => r.pending === 0)).toBe(true);
    expect(fakeSheets.appendCalls).toBe(0);
  });

  it("does not touch rows that were never pending", async () => {
    await postJson(rsvpRoute, rsvp());
    const before = await rsvps();
    await backfill(await db(), fakeSheets, NAMES);
    expect(fakeSheets.appendCalls).toBe(1);
    expect(await rsvps()).toEqual(before);
  });
});

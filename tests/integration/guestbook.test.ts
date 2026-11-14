import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";
import guestbookRoute from "../../api/guestbook/index";
import { COLLECTIONS, type GuestbookDocument } from "../../server/db/collections";
import { ensureIndexes } from "../../server/db/indexes";
import { SheetsError } from "../../server/sheets/client";
import { fakeSheets } from "../fake-sheets";
import { freshIp, getJson, postJson, useTestDatabase, type ApiBody } from "./helpers";

const { db } = useTestDatabase();
afterEach(() => vi.useRealTimers());

const send = (body: unknown, ip?: string) => postJson(guestbookRoute, body, ip, "/api/guestbook");
const list = (query = "", ip?: string) => getJson(guestbookRoute, `/api/guestbook${query}`, ip);
const entries = async () => (await db()).collection<GuestbookDocument>(COLLECTIONS.guestbookEntries).find().sort({ createdAt: 1 }).toArray();
const json = async (res: Response) => (await res.json()) as ApiBody;
interface Page {
  entries: { displayName: string; message: string; createdAt: string }[];
  nextCursor: string | null;
}
const page = async (res: Response) => ((await res.json()) as { data: Page }).data;

describe("POST /api/guestbook: who is shown", () => {
  it("publishes a named wish immediately: stored, returned by GET and mirrored", async () => {
    const res = await send({ displayName: "Aisyah", message: "Selamat pengantin baru!" });
    expect(res.status).toBe(201);
    expect(await json(res)).toEqual({ data: { published: true }, error: null });

    expect((await entries())[0]).toMatchObject({ displayName: "Aisyah", message: "Selamat pengantin baru!", isPublic: true, sheetStatus: "synced" });
    const shown = await page(await list());
    expect(shown.entries).toHaveLength(1);
    expect(shown.entries[0]).toMatchObject({ displayName: "Aisyah", message: "Selamat pengantin baru!" });
    expect(fakeSheets.rows("Guestbook")).toHaveLength(1);
  });

  it.each([
    ["no name", { message: "Hello" }],
    ["a blank name", { displayName: "   ", message: "Hello" }],
  ])("keeps a wish with %s private: saved and mirrored as anonymous, never returned", async (_name, body) => {
    const res = await send(body);
    expect((await json(res)).data).toEqual({ published: false });
    expect(res.status).toBe(201);
    expect((await entries())[0]).toMatchObject({ isPublic: false });
    expect((await page(await list())).entries).toEqual([]);
    expect(fakeSheets.rows("Guestbook")[0]?.slice(2, 5)).toEqual(["", "anonymous", "Hello"]);
  });

  it("keeps 'send anonymously' private but stores and mirrors the name for the couple", async () => {
    const res = await send({ displayName: "Aisyah", anonymous: true, message: "Secret wish" });
    expect((await json(res)).data).toEqual({ published: false });
    expect((await entries())[0]).toMatchObject({ displayName: "Aisyah", isPublic: false });
    expect(fakeSheets.rows("Guestbook")[0]?.slice(2, 5)).toEqual(["Aisyah", "anonymous", "Secret wish"]);
    const text = JSON.stringify(await page(await list()));
    expect(text).not.toMatch(/Aisyah|Secret/);
  });

  it("ignores a client-sent isPublic or id", async () => {
    await send({ message: "x", isPublic: true, _id: "abc", sheetStatus: "synced" });
    expect((await entries())[0]).toMatchObject({ isPublic: false });
    expect((await page(await list())).entries).toEqual([]);
  });
});

describe("POST /api/guestbook: content is plain text", () => {
  it("stores and returns markup exactly as typed, with line breaks and emoji, and mirrors it unchanged", async () => {
    const message = "<script>alert('x')</script>\n<img src=x onerror=alert(1)> 🎉 =SUM(A1)";
    await send({ displayName: "<b>Bold</b> 李", message });
    const shown = (await page(await list())).entries[0];
    expect(shown).toMatchObject({ displayName: "<b>Bold</b> 李", message });
    expect(fakeSheets.rows("Guestbook")[0]?.[4]).toBe(message);
  });

  it("normalises whitespace in the name and message", async () => {
    await send({ displayName: "  Nik   Aisyah ", message: "a  \r\n\r\n\r\n\r\nb  " });
    expect((await page(await list())).entries[0]).toMatchObject({ displayName: "Nik Aisyah", message: "a\n\nb" });
  });
});

describe("POST /api/guestbook: rejections store and mirror nothing", () => {
  it.each<[string, unknown]>([
    ["no message", { displayName: "A" }],
    ["an empty message", { displayName: "A", message: "" }],
    ["a whitespace-only message", { displayName: "A", message: " \n " }],
    ["an over-long message", { displayName: "A", message: "x".repeat(501) }],
    ["an over-long name", { displayName: "x".repeat(61), message: "Hi" }],
    ["a zero-width character", { displayName: "A\u200bB", message: "Hi" }],
    ["wrong types", { displayName: 5, message: ["x"] }],
  ])("%s", async (_name, body) => {
    const res = await send(body);
    expect(res.status).toBe(400);
    expect((await json(res)).error?.code).toBe("VALIDATION_ERROR");
    expect(await entries()).toHaveLength(0);
    expect(fakeSheets.appendCalls).toBe(0);
  });

  it("accepts a message and name exactly at the limits", async () => {
    expect((await send({ displayName: "n".repeat(60), message: "m".repeat(500) })).status).toBe(201);
  });

  it("rejects a filled honeypot with a generic error that names no field, and stores nothing", async () => {
    const res = await send({ displayName: "Bot", message: "Buy now", homepage: "http://spam.example" });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toEqual({ code: "VALIDATION_ERROR", message: "Please check your responses." });
    expect(JSON.stringify(body)).not.toMatch(/homepage|honey/i);
    expect(await entries()).toHaveLength(0);
    expect(fakeSheets.appendCalls).toBe(0);
  });

  it("accepts an empty honeypot, as a real browser sends it", async () => {
    expect((await send({ displayName: "A", message: "Hi", homepage: "" })).status).toBe(201);
  });

  it("answers 413 for an oversized body and 415 for the wrong content type", async () => {
    expect((await send({ message: "x".repeat(9000) })).status).toBe(413);
    const wrong = await guestbookRoute.fetch(
      new Request("https://example.test/api/guestbook", { method: "POST", headers: { "content-type": "text/plain", "x-real-ip": freshIp() }, body: "hi" }),
    );
    expect(wrong.status).toBe(415);
  });

  it.each(["PUT", "PATCH", "DELETE", "OPTIONS"])("answers %s with 405 and Allow: GET, POST", async (method) => {
    const res = await guestbookRoute.fetch(new Request("https://example.test/api/guestbook", { method }));
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, POST");
  });
});

describe("GET /api/guestbook", () => {
  async function seed(count: number, opts: { sameTime?: Date; privateEvery?: number } = {}) {
    const col = (await db()).collection<GuestbookDocument>(COLLECTIONS.guestbookEntries);
    const docs: GuestbookDocument[] = [];
    for (let i = 0; i < count; i++) {
      const isPublic = !(opts.privateEvery && i % opts.privateEvery === 0);
      docs.push({
        ...(isPublic ? { displayName: `Guest ${i}` } : {}),
        message: `Message ${i}`,
        isPublic,
        createdAt: opts.sameTime ?? new Date(Date.parse("2026-01-01T10:00:00Z") + i * 1000),
        sheetStatus: "synced",
      });
    }
    await col.insertMany(docs);
  }
  async function readAll(limit: number) {
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 100; i++) {
      const query: string = `?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
      const p = await page(await list(query));
      seen.push(...p.entries.map((e) => e.message));
      if (!p.nextCursor) return { seen, pages: i + 1 };
      cursor = p.nextCursor;
    }
    throw new Error("did not end");
  }

  it("returns an empty list and no cursor when there are no entries", async () => {
    const res = await list();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await page(res)).toEqual({ entries: [], nextCursor: null });
  });

  it("returns only name, message and time per entry: no ids, flags, sheet status or private entries", async () => {
    await seed(6, { privateEvery: 3 });
    const res = await list();
    const text = await res.text();
    expect(text).not.toMatch(/_id|isPublic|sheetStatus|sheetSyncedAt|canonical/);
    const shown = (JSON.parse(text) as { data: Page }).data.entries;
    expect(shown.map((e) => e.message)).toEqual(["Message 5", "Message 4", "Message 2", "Message 1"]);
    expect(Object.keys(shown[0] ?? {}).sort()).toEqual(["createdAt", "displayName", "message"]);
    expect(text).not.toMatch(/Message 3|Message 0/);
  });

  it("uses a default page of 20 and honours limits from 1 to 50", async () => {
    await seed(60);
    expect((await page(await list())).entries).toHaveLength(20);
    expect((await page(await list("?limit=1"))).entries).toHaveLength(1);
    expect((await page(await list("?limit=50"))).entries).toHaveLength(50);
  });

  it.each([
    ["exactly one page", 5, 5, 1],
    ["one more than a page", 6, 5, 2],
    ["several pages", 23, 5, 5],
    ["pages of one", 4, 1, 4],
  ])("pages through %s newest first without gaps or repeats", async (_name, total, limit, pages) => {
    await seed(total);
    const { seen, pages: used } = await readAll(limit);
    expect(used).toBe(pages);
    expect(seen).toEqual(Array.from({ length: total }, (_, i) => `Message ${total - 1 - i}`));
  });

  it("gives no cursor when the final page is exactly full", async () => {
    await seed(5);
    expect((await page(await list("?limit=5"))).nextCursor).toBeNull();
  });

  it("does not skip or repeat entries with identical timestamps, and skips private ones between pages", async () => {
    await seed(40, { sameTime: new Date("2026-12-01T10:00:00Z"), privateEvery: 4 });
    const { seen } = await readAll(3);
    expect(seen).toHaveLength(30);
    expect(new Set(seen).size).toBe(30);
  });

  it.each(["?limit=0", "?limit=51", "?limit=-3", "?limit=abc", "?limit=2.5", "?cursor=nope", "?cursor=123", `?cursor=${"9".repeat(13)}_${"z".repeat(24)}`])(
    "rejects %s with 400",
    async (query) => {
      const res = await list(query);
      expect(res.status).toBe(400);
      expect((await json(res)).error?.code).toBe("VALIDATION_ERROR");
    },
  );

  it("treats a valid cursor that points at nothing as the end of the list", async () => {
    await seed(3);
    const p = await page(await list(`?cursor=${Date.parse("2020-01-01")}_${new ObjectId().toHexString()}`));
    expect(p.entries.map((e) => e.message)).toEqual([]);
    expect(p.nextCursor).toBeNull();
  });

  it("reflects a new submission straight away", async () => {
    await seed(2);
    await send({ displayName: "New", message: "Just now" });
    expect((await page(await list())).entries[0]).toMatchObject({ displayName: "New", message: "Just now" });
  });
});

describe("rate limiting", () => {
  it("allows 20 submissions per window, then 429 with Retry-After, and stores no more", async () => {
    const ip = freshIp();
    for (let i = 0; i < 20; i++) expect((await send({ displayName: "A", message: `m${i}` }, ip)).status).toBe(201);
    const blocked = await send({ displayName: "A", message: "one too many" }, ip);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await entries()).toHaveLength(20);
  });

  it("allows 120 reads per window, then 429, separately from writes", async () => {
    const ip = freshIp();
    for (let i = 0; i < 120; i++) expect((await list("", ip)).status).toBe(200);
    expect((await list("", ip)).status).toBe(429);
    expect((await send({ displayName: "A", message: "still can write" }, ip)).status).toBe(201);
  });
});

describe("Sheets write-through", () => {
  it("still answers 201 and keeps the wish when Google is down, leaving it pending", async () => {
    fakeSheets.failWith = new SheetsError("http", 503);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await send({ displayName: "Aisyah", message: "Hello" });
    expect(res.status).toBe(201);
    expect((await json(res)).data).toEqual({ published: true });
    expect((await entries())[0]).toMatchObject({ isPublic: true, sheetStatus: "pending" });
    expect((await entries())[0]).not.toHaveProperty("sheetSyncedAt");
    expect((await page(await list())).entries).toHaveLength(1);
  });

  it("appends exactly one row per submission, then marks it synced with a timestamp", async () => {
    await send({ displayName: "Aisyah", message: "One" });
    await send({ displayName: "Zahra", message: "Two" });
    expect(fakeSheets.appendCalls).toBe(2);
    const docs = await entries();
    expect(docs.map((d) => d.sheetStatus)).toEqual(["synced", "synced"]);
    expect(docs[0]?.sheetSyncedAt).toBeInstanceOf(Date);
    expect(fakeSheets.rows("Guestbook").map((r) => r[0])).toEqual(docs.map((d) => d._id.toHexString()));
  });

  it("never puts anything but the five documented columns in the row", async () => {
    await send({ displayName: "Aisyah", message: "Hello", isPublic: true });
    const row = fakeSheets.rows("Guestbook")[0] ?? [];
    expect(row).toHaveLength(5);
    expect(row[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
  });
});

describe("indexes", () => {
  it("creates the cursor index and the partial pending index, idempotently", async () => {
    const database = await db();
    await ensureIndexes(database);
    await ensureIndexes(database);
    const indexes = await database.collection(COLLECTIONS.guestbookEntries).indexes();
    expect(indexes.find((i) => i.name === "isPublic_createdAt_id")).toMatchObject({ key: { isPublic: 1, createdAt: -1, _id: -1 } });
    expect(indexes.find((i) => i.name === "sheetStatus_pending")).toMatchObject({ partialFilterExpression: { sheetStatus: "pending" } });
  });

  it("serves the public list from the index, not a collection scan", async () => {
    const database = await db();
    await ensureIndexes(database);
    const plan = await database
      .collection(COLLECTIONS.guestbookEntries)
      .find({ isPublic: true })
      .sort({ createdAt: -1, _id: -1 })
      .limit(21)
      .explain("queryPlanner");
    expect(JSON.stringify(plan)).toMatch(/IXSCAN/);
    expect(JSON.stringify(plan)).not.toMatch(/COLLSCAN/);
  });
});

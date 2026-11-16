import { afterEach, describe, expect, it, vi } from "vitest";
import configRoute from "../../api/rsvp/config";
import rsvpRoute from "../../api/rsvp/index";
import { COLLECTIONS } from "../../server/db/collections";
import { ensureIndexes } from "../../server/db/indexes";
import { INDEX_RECHECK_MS } from "../../server/rsvp/index-guard";
import { freshIp, postJson, useTestDatabase, type ApiBody } from "./helpers";

const { db } = useTestDatabase();

const family = (n: number) => ({ familyGroupName: `Family ${n}`, phoneNumber: "+673 812 3456", status: "attending", attendeeCount: 1 });
const json = async (res: Response) => (await res.json()) as ApiBody;
const rsvps = async () => (await db()).collection(COLLECTIONS.rsvps);
const dropUnique = async () => (await rsvps()).dropIndex("canonicalGroupKey_unique");

/** Each test starts at a fresh clock far from the previous one, so the 10-minute verification cache never leaks. */
let clock = Date.parse("2026-12-01T00:00:00+08:00");
function startAt() {
  clock += 3 * INDEX_RECHECK_MS;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(clock);
}
const advance = (ms: number) => vi.setSystemTime(Date.now() + ms);

afterEach(async () => {
  vi.useRealTimers();
  await ensureIndexes(await db());
});

describe("when the unique index is missing", () => {
  it("refuses both RSVP endpoints with a generic 503 and stores nothing", async () => {
    startAt();
    await dropUnique();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const config = await postJson(configRoute, {}, freshIp(), "/api/rsvp/config");
    const submit = await postJson(rsvpRoute, family(1));
    expect([config.status, submit.status]).toEqual([503, 503]);

    for (const res of [config, submit]) {
      const body = await json(res);
      expect(body.data).toBeNull();
      expect(body.error?.code).toBe("SERVICE_NOT_READY");
      expect(JSON.stringify(body)).not.toMatch(/index|canonical|mongo|collection|sanding/i);
    }
    expect(await (await rsvps()).countDocuments()).toBe(0);
    expect(spy.mock.calls.flat().join(" ")).toContain("missing_index:rsvps.canonicalGroupKey_unique");
    spy.mockRestore();
  });

  it("works again as soon as the index is created, without waiting for any cache", async () => {
    startAt();
    await dropUnique();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await postJson(rsvpRoute, family(2))).status).toBe(503);
    await ensureIndexes(await db());
    expect((await postJson(rsvpRoute, family(2))).status).toBe(201);
  });

  it("treats a missing collection like a missing index (503, not a crash)", async () => {
    startAt();
    await (await rsvps()).drop();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await postJson(rsvpRoute, family(3))).status).toBe(503);
  });

  it("does not accept a non-unique index on the same field", async () => {
    startAt();
    await dropUnique();
    await (await rsvps()).createIndex({ canonicalGroupKey: 1 }, { name: "not_unique" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await postJson(rsvpRoute, family(4))).status).toBe(503);
    await (await rsvps()).dropIndex("not_unique");
  });

  it("does not accept a partial unique index", async () => {
    startAt();
    await dropUnique();
    await (await rsvps()).createIndex(
      { canonicalGroupKey: 1 },
      { name: "partial_unique", unique: true, partialFilterExpression: { status: "attending" } },
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await postJson(rsvpRoute, family(5))).status).toBe(503);
    await (await rsvps()).dropIndex("partial_unique");
  });
});

describe("when the index is present", () => {
  it("does not slow or block normal use", async () => {
    startAt();
    expect((await postJson(configRoute, {}, freshIp(), "/api/rsvp/config")).status).toBe(200);
    expect((await postJson(rsvpRoute, family(6))).status).toBe(201);
  });

  it("re-verifies only every 10 minutes per instance, so a later drop is noticed within that time", async () => {
    startAt();
    expect((await postJson(rsvpRoute, family(7))).status).toBe(201);
    await dropUnique();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    advance(INDEX_RECHECK_MS - 1000);
    expect((await postJson(rsvpRoute, family(8))).status).toBe(201);
    advance(2000);
    expect((await postJson(rsvpRoute, family(9))).status).toBe(503);
  });
});

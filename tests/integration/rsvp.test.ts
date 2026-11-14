import { afterEach, describe, expect, it, vi } from "vitest";
import configRoute from "../../api/rsvp/config";
import rsvpRoute from "../../api/rsvp/index";
import { RSVP_DEADLINE } from "../../shared/config/event";
import { COLLECTIONS, type RsvpDocument } from "../../server/db/collections";
import { ensureIndexes } from "../../server/db/indexes";
import { freshIp, postJson, TEST_INVITE, useTestDatabase, type ApiBody } from "./helpers";

const { db } = useTestDatabase();
afterEach(() => vi.useRealTimers());

const family = (over: Record<string, unknown> = {}) => ({
  familyGroupName: "The Ahmad Family",
  status: "attending",
  attendeeCount: 2,
  ...over,
});
const rsvps = async () => (await db()).collection<RsvpDocument>(COLLECTIONS.rsvps).find().toArray();
const json = async (res: Response) => (await res.json()) as ApiBody;

describe("POST /api/rsvp/config", () => {
  it("returns 10 for a valid invite and 2 otherwise, in an identical shape", async () => {
    const cases = [
      [{ invite: TEST_INVITE }, 10],
      [{}, 2],
      [{ invite: "wrong-wrong-wrong-wrong-1" }, 2],
      [{ invite: "" }, 2],
    ] as const;
    const bodies: ApiBody[] = [];
    for (const [input, max] of cases) {
      const res = await postJson(configRoute, input, freshIp(), "/api/rsvp/config");
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const body = await json(res);
      expect(body.data).toEqual({ maxAttendees: max, rsvpOpen: true });
      bodies.push(body);
    }
    expect(Object.keys(bodies[0]?.data ?? {})).toEqual(Object.keys(bodies[1]?.data ?? {}));
  });

  it("does not write any RSVP data", async () => {
    await postJson(configRoute, { invite: TEST_INVITE }, freshIp(), "/api/rsvp/config");
    expect(await rsvps()).toHaveLength(0);
  });
});

describe("POST /api/rsvp: accepted submissions", () => {
  it("stores an external RSVP and answers with only the confirmation fields", async () => {
    const res = await postJson(rsvpRoute, family({ familyGroupName: "  The   Ahmad Family " }));
    expect(res.status).toBe(201);
    expect(await json(res)).toEqual({ data: { status: "attending", attendeeCount: 2 }, error: null });

    const docs = await rsvps();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      familyGroupName: "The Ahmad Family",
      canonicalGroupKey: "the ahmad family",
      status: "attending",
      attendeeCount: 2,
      guestType: "external",
      sheetStatus: "pending",
    });
    expect(docs[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("accepts 10 attendees with a valid invite, stores guestType internal and never stores the invite", async () => {
    const res = await postJson(rsvpRoute, family({ attendeeCount: 10, invite: TEST_INVITE }));
    expect(res.status).toBe(201);
    const docs = await rsvps();
    expect(docs[0]?.guestType).toBe("internal");
    expect(JSON.stringify(docs)).not.toContain(TEST_INVITE);
  });

  it("stores a declined RSVP explicitly with zero attendees", async () => {
    const res = await postJson(rsvpRoute, family({ status: "declined", attendeeCount: 0 }));
    expect(res.status).toBe(201);
    expect((await rsvps())[0]).toMatchObject({ status: "declined", attendeeCount: 0 });
  });

  it("keeps Unicode names intact", async () => {
    const res = await postJson(rsvpRoute, family({ familyGroupName: "Keluarga Zoë 李" }));
    expect(res.status).toBe(201);
    expect((await rsvps())[0]?.familyGroupName).toBe("Keluarga Zoë 李");
  });
});

describe("POST /api/rsvp: limits come from the server-verified invite", () => {
  it.each([
    ["clean link, 3 attendees", {}, 3],
    ["wrong invite, 3 attendees", { invite: "wrong-wrong-wrong-wrong-1" }, 3],
    ["rotated invite, 10 attendees", { invite: "an-older-invite-code-12345" }, 10],
    ["valid invite, 11 attendees", { invite: TEST_INVITE }, 11],
    ["client-sent guestType internal, 5 attendees", { guestType: "internal" }, 5],
    ["client-sent maxAttendees 10, 5 attendees", { maxAttendees: 10 }, 5],
  ])("rejects %s and stores nothing", async (_name, extra, count) => {
    const res = await postJson(rsvpRoute, family({ attendeeCount: count, ...extra }));
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error?.code).toBe("ATTENDEE_LIMIT_EXCEEDED");
    expect(body.error?.message).toMatch(/^The maximum is (2|10) attendees\.$/);
    expect(await rsvps()).toHaveLength(0);
  });

  it("gives a wrong invite exactly the same response as no invite", async () => {
    const none = await postJson(rsvpRoute, family({ attendeeCount: 3 }));
    const wrong = await postJson(rsvpRoute, family({ attendeeCount: 3, invite: "wrong-wrong-wrong-wrong-1" }));
    expect([wrong.status, await json(wrong)]).toEqual([none.status, await json(none)]);
  });

  it.each([
    ["attending with zero attendees", { attendeeCount: 0 }],
    ["declined with attendees", { status: "declined", attendeeCount: 2 }],
    ["empty name", { familyGroupName: "   " }],
    ["zero-width character in the name", { familyGroupName: "Ahmad\u200bFamily" }],
  ])("rejects %s with 400 and stores nothing", async (_name, patch) => {
    const res = await postJson(rsvpRoute, family(patch));
    expect(res.status).toBe(400);
    expect(await rsvps()).toHaveLength(0);
  });
});

describe("POST /api/rsvp: duplicates", () => {
  it("rejects a canonically equal family neutrally and never overwrites the first response", async () => {
    expect((await postJson(rsvpRoute, family({ attendeeCount: 2 }))).status).toBe(201);

    const res = await postJson(
      rsvpRoute,
      family({ familyGroupName: "  the AHMAD   family", status: "declined", attendeeCount: 0 }),
    );
    expect(res.status).toBe(409);
    const text = JSON.stringify(await json(res));
    expect(text).toContain("RSVP_DUPLICATE");
    expect(text).not.toMatch(/attending|declined|"attendeeCount"|Ahmad/);

    const docs = await rsvps();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ familyGroupName: "The Ahmad Family", status: "attending", attendeeCount: 2 });
  });

  it("treats a retry after a successful write as a duplicate, not a second record", async () => {
    await postJson(rsvpRoute, family());
    const retry = await postJson(rsvpRoute, family());
    expect(retry.status).toBe(409);
    expect(await rsvps()).toHaveLength(1);
  });

  it("treats the same family as a duplicate regardless of guest type", async () => {
    await postJson(rsvpRoute, family());
    const res = await postJson(rsvpRoute, family({ invite: TEST_INVITE, attendeeCount: 6 }));
    expect(res.status).toBe(409);
    expect(await rsvps()).toHaveLength(1);
  });

  it("lets exactly one of many concurrent duplicate submissions win", async () => {
    const variants = ["The Ahmad Family", "the ahmad family", "  THE AHMAD   FAMILY ", "The\tAhmad Family"];
    const responses = await Promise.all(
      Array.from({ length: 16 }, (_, i) => postJson(rsvpRoute, family({ familyGroupName: variants[i % 4] }))),
    );
    const statuses = responses.map((res) => res.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(15);
    expect(await rsvps()).toHaveLength(1);
  });

  it("accepts concurrent submissions from different families", async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, i) => postJson(rsvpRoute, family({ familyGroupName: `Family number ${i}` }))),
    );
    expect(responses.map((res) => res.status)).toEqual(Array(10).fill(201));
    expect(await rsvps()).toHaveLength(10);
  });
});

describe("POST /api/rsvp: deadline", () => {
  it("rejects every submission after the deadline with RSVP_CLOSED", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.parse(RSVP_DEADLINE) + 1000));
    const res = await postJson(rsvpRoute, family());
    expect(res.status).toBe(409);
    expect((await json(res)).error?.code).toBe("RSVP_CLOSED");
    expect(await rsvps()).toHaveLength(0);
  });

  it("reports the closed state through the config endpoint", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.parse(RSVP_DEADLINE) + 1000));
    const res = await postJson(configRoute, {}, freshIp(), "/api/rsvp/config");
    expect((await json(res)).data).toEqual({ maxAttendees: 2, rsvpOpen: false });
  });

  it("still accepts submissions made before the deadline", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-20T23:00:00+08:00"));
    expect((await postJson(rsvpRoute, family())).status).toBe(201);
  });
});

describe("privacy: no public read, list or edit", () => {
  it.each(["GET", "PUT", "PATCH", "DELETE"])("%s /api/rsvp is rejected without returning data", async (method) => {
    await postJson(rsvpRoute, family());
    const res = await rsvpRoute.fetch(new Request("https://example.test/api/rsvp", { method }));
    expect(res.status).toBe(405);
    const text = await res.text();
    expect(text).not.toMatch(/Ahmad|attendeeCount/);
  });
});

describe("indexes", () => {
  it("creates the unique canonical key, partial pending-sync and TTL indexes, and is idempotent", async () => {
    const database = await db();
    await ensureIndexes(database);
    await ensureIndexes(database);

    const rsvpIndexes = await database.collection(COLLECTIONS.rsvps).indexes();
    expect(rsvpIndexes.find((i) => i.name === "canonicalGroupKey_unique")).toMatchObject({
      key: { canonicalGroupKey: 1 },
      unique: true,
    });
    expect(rsvpIndexes.find((i) => i.name === "sheetStatus_pending")).toMatchObject({
      key: { sheetStatus: 1 },
      partialFilterExpression: { sheetStatus: "pending" },
    });
    const ttl = (await database.collection(COLLECTIONS.rateLimits).indexes()).find((i) => i.name === "expiresAt_ttl");
    expect(ttl).toMatchObject({ key: { expiresAt: 1 }, expireAfterSeconds: 0 });
  });

  it("enforces uniqueness in the database itself, not only in application code", async () => {
    const database = await db();
    const doc = {
      familyGroupName: "Direct Insert",
      canonicalGroupKey: "direct insert",
      status: "attending",
      attendeeCount: 1,
      guestType: "external",
      createdAt: new Date(),
      sheetStatus: "pending",
    };
    await database.collection(COLLECTIONS.rsvps).insertOne({ ...doc });
    await expect(database.collection(COLLECTIONS.rsvps).insertOne({ ...doc })).rejects.toMatchObject({ code: 11000 });
  });
});

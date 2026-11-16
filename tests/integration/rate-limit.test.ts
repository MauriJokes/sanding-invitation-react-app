import { afterEach, describe, expect, it, vi } from "vitest";
import configRoute from "../../api/rsvp/config";
import rsvpRoute from "../../api/rsvp/index";
import { COLLECTIONS, type RateLimitDocument } from "../../server/db/collections";
import { freshIp, postJson, useTestDatabase, type ApiBody } from "./helpers";

const { db } = useTestDatabase();
afterEach(() => vi.useRealTimers());

const rsvpBody = (n: number) => ({ familyGroupName: `Family ${n}`, phoneNumber: "+673 812 3456", status: "attending", attendeeCount: 1 });
const counters = async () => (await db()).collection<RateLimitDocument>(COLLECTIONS.rateLimits).find().toArray();

describe("rate limiting (MongoDB TTL counters keyed by hashed IP)", () => {
  it("allows 10 RSVP submissions per window, then answers 429 with Retry-After and stores nothing more", async () => {
    const ip = freshIp();
    for (let i = 0; i < 10; i++) expect((await postJson(rsvpRoute, rsvpBody(i), ip)).status).toBe(201);

    const blocked = await postJson(rsvpRoute, rsvpBody(99), ip);
    expect(blocked.status).toBe(429);
    const retryAfter = Number(blocked.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(600);
    expect(((await blocked.json()) as ApiBody).error?.code).toBe("RATE_LIMITED");

    const stored = await (await db()).collection(COLLECTIONS.rsvps).countDocuments();
    expect(stored).toBe(10);
  });

  it("does not affect a different client", async () => {
    const noisy = freshIp();
    for (let i = 0; i < 11; i++) await postJson(rsvpRoute, rsvpBody(i), noisy);
    expect((await postJson(rsvpRoute, rsvpBody(500), freshIp())).status).toBe(201);
  });

  it("limits the config endpoint separately from the RSVP endpoint", async () => {
    const ip = freshIp();
    for (let i = 0; i < 30; i++) expect((await postJson(configRoute, {}, ip, "/api/rsvp/config")).status).toBe(200);
    expect((await postJson(configRoute, {}, ip, "/api/rsvp/config")).status).toBe(429);
    expect((await postJson(rsvpRoute, rsvpBody(1), ip)).status).toBe(201);
  });

  it("starts a fresh allowance in the next window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-01T10:00:00Z"));
    const ip = freshIp();
    for (let i = 0; i < 10; i++) await postJson(rsvpRoute, rsvpBody(i), ip);
    expect((await postJson(rsvpRoute, rsvpBody(50), ip)).status).toBe(429);
    vi.setSystemTime(new Date("2026-12-01T10:10:01Z"));
    expect((await postJson(rsvpRoute, rsvpBody(51), ip)).status).toBe(201);
  });

  it("counts concurrent first requests exactly, without errors from the upsert race", async () => {
    const ip = freshIp();
    const responses = await Promise.all(Array.from({ length: 25 }, () => postJson(configRoute, {}, ip, "/api/rsvp/config")));
    expect(responses.map((r) => r.status)).toEqual(Array(25).fill(200));
    const doc = (await counters()).find((c) => c._id.startsWith("rsvp-config:"));
    expect(doc?.count).toBe(25);
  });

  it("stores only hashed IPs, with an expiry for the TTL index", async () => {
    const ip = "203.0.113.77";
    await postJson(configRoute, {}, ip, "/api/rsvp/config");
    const docs = await counters();
    expect(docs).toHaveLength(1);
    expect(JSON.stringify(docs)).not.toContain(ip);
    expect(docs[0]?._id).toMatch(/^rsvp-config:[0-9a-f]{32}:\d+$/);
    expect(docs[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(docs[0]?.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 600_000);
  });

  it("does not spend database writes on requests that fail validation", async () => {
    const ip = freshIp();
    await postJson(rsvpRoute, { familyGroupName: "", status: "x", attendeeCount: "no" }, ip);
    await rsvpRoute.fetch(new Request("https://example.test/api/rsvp", { method: "GET" }));
    expect(await counters()).toHaveLength(0);
  });
});

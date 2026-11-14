import { afterEach, describe, expect, it, vi } from "vitest";
import configRoute from "../../api/rsvp/config";
import rsvpRoute from "../../api/rsvp/index";
import { hashClientIp } from "../../server/rate-limit/rate-limit";

const URL_RSVP = "https://example.test/api/rsvp";
const send = (route: { fetch(r: Request): Promise<Response> }, init: RequestInit & { url?: string } = {}) =>
  route.fetch(
    new Request(init.url ?? URL_RSVP, { method: "POST", headers: { "content-type": "application/json" }, ...init }),
  );

afterEach(() => vi.unstubAllEnvs());

describe("rejections that never reach the database", () => {
  it("rejects non-POST methods with 405 and Allow: POST on both routes", async () => {
    for (const route of [rsvpRoute, configRoute]) {
      for (const method of ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
        const res = await route.fetch(new Request(URL_RSVP, { method }));
        expect(res.status).toBe(405);
        expect(res.headers.get("Allow")).toBe("POST");
        expect(((await res.json()) as { error: { code: string } }).error.code).toBe("METHOD_NOT_ALLOWED");
      }
    }
  });

  it("rejects a wrong content type with 415 and an oversized body with 413", async () => {
    const wrong = await send(rsvpRoute, { headers: { "content-type": "text/plain" }, body: "{}" });
    expect(wrong.status).toBe(415);
    const big = await send(rsvpRoute, { body: JSON.stringify({ familyGroupName: "x".repeat(5000) }) });
    expect(big.status).toBe(413);
    const bigConfig = await send(configRoute, { body: JSON.stringify({ invite: "x".repeat(600) }) });
    expect(bigConfig.status).toBe(413);
  });

  it("rejects invalid JSON with 400 BAD_REQUEST", async () => {
    const res = await send(rsvpRoute, { body: "{oops" });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("BAD_REQUEST");
  });

  it("rejects an invalid body with 400, naming fields but never echoing values", async () => {
    const secretish = "my-private-family-name-\u200b";
    const res = await send(rsvpRoute, {
      body: JSON.stringify({ familyGroupName: secretish, status: "maybe", attendeeCount: 1.5 }),
    });
    expect(res.status).toBe(400);
    const text = await res.text();
    const body = JSON.parse(text) as { data: null; error: { code: string; fields: string[] } };
    expect(body.data).toBeNull();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields.sort()).toEqual(["attendeeCount", "familyGroupName", "status"]);
    expect(text).not.toContain("my-private-family-name");
  });

  it("never sends cross-origin or caching permissions", async () => {
    const res = await send(rsvpRoute, { body: "{oops" });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("misconfiguration", () => {
  it("returns a generic 500 and logs only the variable name, never a value", async () => {
    vi.stubEnv("RATE_LIMIT_SALT", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await send(rsvpRoute, {
      body: JSON.stringify({ familyGroupName: "The Ahmad Family", status: "attending", attendeeCount: 2, invite: "SECRET-INVITE-VALUE" }),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error).toEqual({ code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." });
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain("RATE_LIMIT_SALT");
    expect(logged).not.toContain("SECRET-INVITE-VALUE");
    expect(logged).not.toContain("The Ahmad Family");
  });
});

describe("hashClientIp", () => {
  it("is stable, salted, and does not contain the raw IP", () => {
    const salt = "s".repeat(32);
    const a = hashClientIp("203.0.113.9", salt);
    expect(a).toBe(hashClientIp("203.0.113.9", salt));
    expect(a).not.toBe(hashClientIp("203.0.113.10", salt));
    expect(a).not.toBe(hashClientIp("203.0.113.9", "t".repeat(32)));
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toContain("203");
  });
});

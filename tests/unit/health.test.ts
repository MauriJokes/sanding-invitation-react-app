import { describe, expect, it, vi } from "vitest";
import handler from "../../api/health";

describe("GET /api/health", () => {
  it("returns the common success shape without caching or leaking configuration", async () => {
    const response = handler.fetch(new Request("https://example.test/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = (await response.json()) as { data: Record<string, unknown>; error: unknown };
    expect(body.error).toBeNull();
    expect(Object.keys(body.data).sort()).toEqual(["rsvpOpen", "status"]);
    expect(body.data.status).toBe("ok");
  });

  it("reflects the RSVP deadline", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-12-21T00:00:00+08:00"));
      const closed = (await handler.fetch(new Request("https://example.test/api/health")).json()) as {
        data: { rsvpOpen: boolean };
      };
      expect(closed.data.rsvpOpen).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects other methods with 405 and an Allow header", async () => {
    const response = handler.fetch(new Request("https://example.test/api/health", { method: "POST" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    const body = (await response.json()) as { data: unknown; error: { code: string } };
    expect(body.data).toBeNull();
    expect(body.error.code).toBe("METHOD_NOT_ALLOWED");
  });
});

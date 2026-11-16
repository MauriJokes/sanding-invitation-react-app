import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGuestbookPage,
  submitGuestbook,
} from "../../../src/features/guestbook/api";
import { errorReply, mockFetch, type Reply } from "../rsvp/helpers";

afterEach(() => vi.unstubAllGlobals());

const CURSOR = `1781000000000_${"a".repeat(24)}`;
const pageReply = (entries: unknown[], nextCursor: unknown = null): Reply => ({
  status: 200,
  json: { data: { entries, nextCursor }, error: null },
});
const entry = {
  displayName: "Aisyah",
  message: "Selamat!",
  createdAt: "2026-12-01T10:00:00.000Z",
};

describe("fetchGuestbookPage", () => {
  it("GETs the newest page with no body, no query string and same-origin credentials", async () => {
    const calls = mockFetch(() => pageReply([entry]));
    expect(await fetchGuestbookPage(undefined)).toEqual({
      ok: true,
      data: { entries: [entry], nextCursor: null },
    });
    expect(calls[0]).toMatchObject({ method: "GET", path: "/api/guestbook" });
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.body).toBeUndefined();
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).get("content-type")).toBeNull();
  });

  it("passes the cursor in the query string, encoded", async () => {
    const calls = mockFetch(() => pageReply([]));
    await fetchGuestbookPage(CURSOR);
    expect(calls[0]?.path).toBe(
      `/api/guestbook?cursor=${encodeURIComponent(CURSOR)}`,
    );
  });

  it("accepts a page with a valid next cursor and an empty page", async () => {
    mockFetch(() => pageReply([entry], CURSOR));
    expect(await fetchGuestbookPage(undefined)).toMatchObject({
      ok: true,
      data: { nextCursor: CURSOR },
    });
    mockFetch(() => pageReply([]));
    expect(await fetchGuestbookPage(undefined)).toMatchObject({
      ok: true,
      data: { entries: [] },
    });
  });

  it.each([
    ["entries is not an array", { entries: "x", nextCursor: null }],
    [
      "an entry without a message",
      { entries: [{ displayName: "A", createdAt: "t" }], nextCursor: null },
    ],
    [
      "an entry with a numeric name",
      { entries: [{ ...entry, displayName: 5 }], nextCursor: null },
    ],
    ["a null entry", { entries: [null], nextCursor: null }],
    ["a missing nextCursor", { entries: [] }],
    [
      "a malformed nextCursor",
      { entries: [], nextCursor: "javascript:alert(1)" },
    ],
    ["a non-string nextCursor", { entries: [], nextCursor: 5 }],
  ])("treats a response with %s as no usable answer", async (_name, data) => {
    mockFetch(() => ({ status: 200, json: { data, error: null } }));
    expect(await fetchGuestbookPage(undefined)).toEqual({
      ok: false,
      kind: "network",
    });
  });

  it("reports an HTTP error with its code, and an offline browser as no usable answer", async () => {
    mockFetch(() => errorReply(429, "RATE_LIMITED"));
    expect(await fetchGuestbookPage(undefined)).toMatchObject({
      ok: false,
      kind: "api",
      status: 429,
      code: "RATE_LIMITED",
    });
    mockFetch(() => new TypeError("offline"));
    expect(await fetchGuestbookPage(undefined)).toEqual({
      ok: false,
      kind: "network",
    });
  });
});

describe("submitGuestbook", () => {
  const base = { anonymous: false, message: "Selamat!", homepage: "" };

  it("POSTs JSON with the name, anonymous flag, message and the spam-trap value", async () => {
    const calls = mockFetch(() => ({
      status: 201,
      json: { data: { published: true }, error: null },
    }));
    expect(await submitGuestbook({ ...base, displayName: "Aisyah" })).toEqual({
      ok: true,
      data: { published: true },
    });
    expect(calls[0]).toEqual({
      method: "POST",
      path: "/api/guestbook",
      body: {
        displayName: "Aisyah",
        anonymous: false,
        message: "Selamat!",
        homepage: "",
      },
    });
    expect(
      new Headers(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).get(
        "content-type",
      ),
    ).toBe("application/json");
  });

  it("always sends the name, with the visibility choice, the message and the spam trap", async () => {
    const calls = mockFetch(() => ({
      status: 201,
      json: { data: { published: false }, error: null },
    }));
    await submitGuestbook({ ...base, displayName: "Aisyah", anonymous: true });
    expect(Object.keys(calls[0]?.body ?? {}).sort()).toEqual([
      "anonymous",
      "displayName",
      "homepage",
      "message",
    ]);
  });

  it("never sends a visibility flag, an id or a sheet status", async () => {
    const calls = mockFetch(() => ({
      status: 201,
      json: { data: { published: true }, error: null },
    }));
    await submitGuestbook({ ...base, displayName: "A" });
    expect(JSON.stringify(calls[0]?.body)).not.toMatch(
      /isPublic|sheetStatus|_id/,
    );
  });

  it.each([
    [
      "a wrong-shaped success",
      { status: 201, json: { data: { published: "yes" }, error: null } },
    ],
    ["a non-JSON body", { status: 502, raw: "<html>bad gateway</html>" }],
  ])("treats %s as no usable answer", async (_name, reply) => {
    mockFetch(() => reply);
    expect(await submitGuestbook({ ...base, displayName: "A" })).toEqual({
      ok: false,
      kind: "network",
    });
  });
});

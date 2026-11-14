import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRsvpConfig, submitRsvp } from "../../../src/features/rsvp/api";
import { configReply, createdReply, errorReply, mockFetch, VALID_INVITE } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

describe("fetchRsvpConfig", () => {
  it("posts the invite in the JSON body, never in the URL, without credentials", async () => {
    const calls = mockFetch(() => configReply(10));
    await fetchRsvpConfig(VALID_INVITE);
    expect(calls[0]).toEqual({ path: "/api/rsvp/config", body: { invite: VALID_INVITE } });
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("sends an empty body when there is no invite", async () => {
    const calls = mockFetch(() => configReply(2));
    await fetchRsvpConfig(undefined);
    expect(calls[0]?.body).toEqual({});
  });

  it("returns the validated config", async () => {
    mockFetch(() => configReply(2, false));
    expect(await fetchRsvpConfig(undefined)).toEqual({ ok: true, data: { maxAttendees: 2, rsvpOpen: false } });
  });

  it.each([
    ["not an object", { data: "x", error: null }],
    ["non-integer limit", { data: { maxAttendees: 2.5, rsvpOpen: true }, error: null }],
    ["limit of zero", { data: { maxAttendees: 0, rsvpOpen: true }, error: null }],
    ["absurd limit", { data: { maxAttendees: 1000, rsvpOpen: true }, error: null }],
    ["string limit", { data: { maxAttendees: "10", rsvpOpen: true }, error: null }],
    ["missing rsvpOpen", { data: { maxAttendees: 2 }, error: null }],
    ["array envelope", []],
  ])("treats a %s response as unusable", async (_name, json) => {
    mockFetch(() => ({ status: 200, json }));
    expect(await fetchRsvpConfig(undefined)).toEqual({ ok: false, kind: "network" });
  });
});

describe("submitRsvp", () => {
  const base = { familyGroupName: "The Ahmad Family", status: "attending", attendeeCount: 2 } as const;

  it("sends exactly the documented fields, and never a guest type or limit", async () => {
    const calls = mockFetch(() => createdReply("attending", 2));
    await submitRsvp({ ...base, invite: VALID_INVITE });
    expect(Object.keys(calls[0]?.body ?? {}).sort()).toEqual(["attendeeCount", "familyGroupName", "invite", "status"]);
    await submitRsvp({ ...base, invite: undefined });
    expect(Object.keys(calls[1]?.body ?? {}).sort()).toEqual(["attendeeCount", "familyGroupName", "status"]);
  });

  it("returns the confirmation", async () => {
    mockFetch(() => createdReply("declined", 0));
    expect(await submitRsvp({ ...base, status: "declined", attendeeCount: 0, invite: undefined })).toEqual({
      ok: true,
      data: { status: "declined", attendeeCount: 0 },
    });
  });

  it("exposes only code, status and field names from an error", async () => {
    mockFetch(() => errorReply(400, "ATTENDEE_LIMIT_EXCEEDED", ["attendeeCount"]));
    expect(await submitRsvp({ ...base, invite: undefined })).toEqual({
      ok: false,
      kind: "api",
      status: 400,
      code: "ATTENDEE_LIMIT_EXCEEDED",
      fields: ["attendeeCount"],
    });
  });

  it("drops non-string field names and tolerates a missing fields array", async () => {
    mockFetch(() => ({ status: 400, json: { data: null, error: { code: "VALIDATION_ERROR", fields: ["a", 5, null] } } }));
    expect(await submitRsvp({ ...base, invite: undefined })).toMatchObject({ fields: ["a"] });
    mockFetch(() => errorReply(409, "RSVP_DUPLICATE"));
    expect(await submitRsvp({ ...base, invite: undefined })).toMatchObject({ code: "RSVP_DUPLICATE", fields: [] });
  });

  it.each([
    ["a network error", () => new Error("offline")],
    ["a non-JSON body", () => ({ status: 502, raw: "<html>Bad gateway</html>" })],
    ["a 2xx with the wrong shape", () => ({ status: 201, json: { data: { status: "maybe", attendeeCount: 1 }, error: null } })],
    ["an error without a code", () => ({ status: 500, json: { data: null, error: {} } })],
    ["a null body", () => ({ status: 200, raw: "null" })],
  ])("reports %s as no usable answer", async (_name, reply) => {
    mockFetch(reply);
    expect(await submitRsvp({ ...base, invite: undefined })).toEqual({ ok: false, kind: "network" });
  });

  it("reports an aborted request (navigation or unmount) as no usable answer, not as an API error", async () => {
    mockFetch(() => new DOMException("The operation was aborted.", "AbortError"));
    expect(await fetchRsvpConfig(undefined, new AbortController().signal)).toEqual({ ok: false, kind: "network" });
  });
});

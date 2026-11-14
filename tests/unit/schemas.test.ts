import { describe, expect, it } from "vitest";
import {
  FAMILY_NAME_MAX,
  FAMILY_NAME_MIN,
  MAX_ATTENDEES,
  rsvpConfigRequestSchema,
  rsvpRequestSchema,
} from "../../shared/rsvp/schemas";

const valid = { familyGroupName: "The Ahmad Family", status: "attending", attendeeCount: 2 };

describe("approved limits", () => {
  it("are internal 10 and external 2", () => {
    expect(MAX_ATTENDEES).toEqual({ internal: 10, external: 2 });
  });
});

describe("rsvpRequestSchema", () => {
  it("accepts a valid request and normalises the name", () => {
    const parsed = rsvpRequestSchema.parse({ ...valid, familyGroupName: "  The   Ahmad \t Family " });
    expect(parsed.familyGroupName).toBe("The Ahmad Family");
  });

  it("accepts a declined RSVP with zero attendees", () => {
    expect(rsvpRequestSchema.safeParse({ ...valid, status: "declined", attendeeCount: 0 }).success).toBe(true);
  });

  it("ignores a client-sent guestType or limit instead of trusting it", () => {
    const parsed = rsvpRequestSchema.parse({ ...valid, guestType: "internal", maxAttendees: 10 });
    expect(parsed).not.toHaveProperty("guestType");
    expect(parsed).not.toHaveProperty("maxAttendees");
  });

  it.each([
    ["empty name", { familyGroupName: "" }],
    ["blank name", { familyGroupName: "   " }],
    ["single character", { familyGroupName: "A".repeat(FAMILY_NAME_MIN - 1) }],
    ["over-long name", { familyGroupName: "A".repeat(FAMILY_NAME_MAX + 1) }],
    ["zero-width character", { familyGroupName: "Ahmad\u200bFamily" }],
    ["bidi control character", { familyGroupName: "Ahmad\u202eFamily" }],
    ["NUL character", { familyGroupName: "Ahmad\u0000Family" }],
    ["non-string name", { familyGroupName: 42 }],
    ["unknown status", { status: "maybe" }],
    ["fractional count", { attendeeCount: 1.5 }],
    ["negative count", { attendeeCount: -1 }],
    ["string count", { attendeeCount: "2" }],
    ["absurd count", { attendeeCount: 1_000_000 }],
    ["non-string invite", { invite: 123 }],
    ["over-long invite", { invite: "x".repeat(129) }],
  ])("rejects %s", (_name, patch) => {
    expect(rsvpRequestSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("rejects a missing required field", () => {
    for (const key of ["familyGroupName", "status", "attendeeCount"]) {
      const rest: Record<string, unknown> = { ...valid };
      delete rest[key];
      expect(rsvpRequestSchema.safeParse(rest).success).toBe(false);
    }
  });

  it("accepts a name at the length limits", () => {
    expect(rsvpRequestSchema.safeParse({ ...valid, familyGroupName: "A".repeat(FAMILY_NAME_MAX) }).success).toBe(true);
    expect(rsvpRequestSchema.safeParse({ ...valid, familyGroupName: "A".repeat(FAMILY_NAME_MIN) }).success).toBe(true);
  });

  it("keeps non-Latin and accented names", () => {
    expect(rsvpRequestSchema.safeParse({ ...valid, familyGroupName: "Keluarga Zoë 李" }).success).toBe(true);
  });
});

describe("rsvpConfigRequestSchema", () => {
  it("accepts an empty object or an invite and strips anything else", () => {
    expect(rsvpConfigRequestSchema.parse({})).toEqual({});
    expect(rsvpConfigRequestSchema.parse({ invite: "abc", guestType: "internal" })).toEqual({ invite: "abc" });
  });
});

import { describe, expect, it } from "vitest";
import {
  FAMILY_NAME_MAX,
  FAMILY_NAME_MIN,
  MAX_ATTENDEES,
  PHONE_NUMBER_MAX,
  normalizePhoneNumber,
  rsvpConfigRequestSchema,
  rsvpRequestSchema,
} from "../../shared/rsvp/schemas";

const valid = {
  familyGroupName: "The Ahmad Family",
  phoneNumber: "+673 812 3456",
  status: "attending",
  attendeeCount: 2,
};

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
    ["empty phone number", { phoneNumber: "" }],
    ["phone number without a country code", { phoneNumber: "8123456" }],
    ["phone number with letters", { phoneNumber: "+673 abc 3456" }],
    ["phone number with a zero-width character", { phoneNumber: "+673\u200b8123456" }],
    ["non-string phone number", { phoneNumber: 6738123456 }],
    ["over-long phone number", { phoneNumber: `+673${"1".repeat(PHONE_NUMBER_MAX)}` }],
    ["impossible phone number", { phoneNumber: "+673 1" }],
    ["Singapore phone number", { phoneNumber: "+65 6123 4567" }],
    ["US phone number", { phoneNumber: "+1 202 555 0100" }],
    ["over-long invite", { invite: "x".repeat(129) }],
  ])("rejects %s", (_name, patch) => {
    expect(rsvpRequestSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("rejects a missing required field", () => {
    for (const key of ["familyGroupName", "phoneNumber", "status", "attendeeCount"]) {
      const rest: Record<string, unknown> = { ...valid };
      delete rest[key];
      expect(rsvpRequestSchema.safeParse(rest).success).toBe(false);
    }
  });

  it("stores the phone number in E.164 form whatever the guest typed", () => {
    for (const typed of ["+673 812 3456", "+673-812-3456", "+673 (812) 3456", " +6738123456 "]) {
      expect(rsvpRequestSchema.parse({ ...valid, phoneNumber: typed }).phoneNumber).toBe("+6738123456");
    }
  });

  it("accepts a valid number from another country", () => {
    expect(rsvpRequestSchema.parse({ ...valid, phoneNumber: "+60 12-345 6789" }).phoneNumber).toBe("+60123456789");
  });

  it("accepts a name at the length limits", () => {
    expect(rsvpRequestSchema.safeParse({ ...valid, familyGroupName: "A".repeat(FAMILY_NAME_MAX) }).success).toBe(true);
    expect(rsvpRequestSchema.safeParse({ ...valid, familyGroupName: "A".repeat(FAMILY_NAME_MIN) }).success).toBe(true);
  });

  it("keeps non-Latin and accented names", () => {
    expect(rsvpRequestSchema.safeParse({ ...valid, familyGroupName: "Keluarga Zoë 李" }).success).toBe(true);
  });
});

describe("normalizePhoneNumber", () => {
  it("returns E.164 for a valid international number", () => {
    expect(normalizePhoneNumber("+673 812 3456")).toBe("+6738123456");
  });

  it("accepts a Malaysian number", () => {
    expect(normalizePhoneNumber("+60 12-345 6789")).toBe("+60123456789");
  });

  it.each(["", "   ", "8123456", "0812345678", "+", "+673", "abc", "+65 6123 4567", "+1 202 555 0100"])(
    "returns null for %j without a country",
    (raw) => {
      expect(normalizePhoneNumber(raw)).toBeNull();
    },
  );

  describe("with the country chosen in the form", () => {
    it.each([
      ["8123456", "BN", "+6738123456"],
      ["812 3456", "BN", "+6738123456"],
      ["12 345 6789", "MY", "+60123456789"],
      ["012-345 6789", "MY", "+60123456789"],
    ] as const)("reads %j as a %s national number", (raw, country, expected) => {
      expect(normalizePhoneNumber(raw, country)).toBe(expected);
    });

    it.each([
      ["a plus sign", "+6738123456", "BN"],
      ["a Brunei number under Malaysia", "8123456", "MY"],
      ["a Malaysian number under Brunei", "12 345 6789", "BN"],
      ["nothing", "", "BN"],
    ] as const)("rejects %s", (_name, raw, country) => {
      expect(normalizePhoneNumber(raw, country)).toBeNull();
    });
  });
});

describe("rsvpConfigRequestSchema", () => {
  it("accepts an empty object or an invite and strips anything else", () => {
    expect(rsvpConfigRequestSchema.parse({})).toEqual({});
    expect(rsvpConfigRequestSchema.parse({ invite: "abc", guestType: "internal" })).toEqual({ invite: "abc" });
  });
});

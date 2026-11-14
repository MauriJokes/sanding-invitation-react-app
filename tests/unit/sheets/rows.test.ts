import { describe, expect, it } from "vitest";
import { GUESTBOOK_HEADERS, RSVP_HEADERS, formatVenueTimestamp, guestbookRow, rsvpRow } from "../../../server/sheets/rows";

describe("formatVenueTimestamp", () => {
  it.each([
    ["2026-12-28T11:15:00Z", "2026-12-28T19:15:00+08:00"],
    ["2026-12-27T16:00:00Z", "2026-12-28T00:00:00+08:00"], // midnight is 00, never 24
    ["2026-12-31T15:59:59Z", "2026-12-31T23:59:59+08:00"],
    ["2026-12-31T16:00:00Z", "2027-01-01T00:00:00+08:00"], // rolls into the next year
  ])("formats %s in Brunei time", (iso, expected) => {
    expect(formatVenueTimestamp(new Date(iso))).toBe(expected);
  });

  it("derives the offset from the zone, not a constant", () => {
    expect(formatVenueTimestamp(new Date("2026-01-15T12:00:00Z"), "America/New_York")).toBe("2026-01-15T07:00:00-05:00");
    expect(formatVenueTimestamp(new Date("2026-07-15T12:00:00Z"), "America/New_York")).toBe("2026-07-15T08:00:00-04:00");
    expect(formatVenueTimestamp(new Date("2026-06-01T00:00:00Z"), "Asia/Kolkata")).toBe("2026-06-01T05:30:00+05:30");
    expect(formatVenueTimestamp(new Date("2026-06-01T00:00:00Z"), "UTC")).toBe("2026-06-01T00:00:00+00:00");
  });
});

describe("rsvpRow", () => {
  const doc = {
    createdAt: new Date("2026-12-01T04:05:06Z"),
    familyGroupName: "The Lim Family",
    guestType: "internal",
    status: "attending",
    attendeeCount: 6,
  } as const;

  it("has one value per header, in the documented order", () => {
    expect(rsvpRow("abc123", doc)).toEqual(["abc123", "2026-12-01T12:05:06+08:00", "The Lim Family", "internal", "attending", 6]);
    expect(rsvpRow("abc123", doc)).toHaveLength(RSVP_HEADERS.length);
  });

  it("carries a declined RSVP with zero attendees as a number", () => {
    expect(rsvpRow("x", { ...doc, status: "declined", attendeeCount: 0 }).slice(4)).toEqual(["declined", 0]);
  });

  it("passes formula-like text through unchanged (the sheet is written RAW, so it stays text)", () => {
    for (const text of ["=1+1", "+cmd|' /C calc'!A0", "-2+3", "@SUM(A1)", "=HYPERLINK(\"http://x\")"]) {
      expect(rsvpRow("x", { ...doc, familyGroupName: text })[2]).toBe(text);
    }
  });
});

describe("guestbookRow", () => {
  const base = { createdAt: new Date("2026-12-01T04:05:06Z"), message: "Selamat!" };

  it("labels a public entry and has one value per header", () => {
    const row = guestbookRow("g1", { ...base, displayName: "Aisyah", isPublic: true });
    expect(row).toEqual(["g1", "2026-12-01T12:05:06+08:00", "Aisyah", "public", "Selamat!"]);
    expect(row).toHaveLength(GUESTBOOK_HEADERS.length);
  });

  it("keeps the name of an anonymous entry for the couple and labels it anonymous", () => {
    expect(guestbookRow("g2", { ...base, displayName: "Aisyah", isPublic: false }).slice(2, 4)).toEqual(["Aisyah", "anonymous"]);
  });

  it("leaves the name blank when none was given", () => {
    expect(guestbookRow("g3", { ...base, isPublic: false }).slice(2, 4)).toEqual(["", "anonymous"]);
  });

  it("keeps line breaks and markup as plain text", () => {
    expect(guestbookRow("g4", { ...base, displayName: "A", isPublic: true, message: "a\n<b>b</b>" })[4]).toBe("a\n<b>b</b>");
  });
});

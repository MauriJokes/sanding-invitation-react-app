import { describe, expect, it } from "vitest";
import { EVENT, RSVP_DEADLINE, VENUE_TIMEZONE, isRsvpOpen } from "../../shared/config/event";

describe("event configuration", () => {
  it("uses the venue timezone and an unambiguous start instant", () => {
    expect(VENUE_TIMEZONE).toBe("Asia/Brunei");
    expect(new Date(EVENT.startsAt).toISOString()).toBe("2026-12-28T11:15:00.000Z");
  });

  it("does not publish an end time", () => {
    expect("endsAt" in EVENT).toBe(false);
  });
});

describe("isRsvpOpen", () => {
  const deadline = Date.parse(RSVP_DEADLINE);

  it("is open before and exactly at the deadline", () => {
    expect(isRsvpOpen(new Date(deadline - 1))).toBe(true);
    expect(isRsvpOpen(new Date(deadline))).toBe(true);
  });

  it("is closed after the deadline", () => {
    expect(isRsvpOpen(new Date(deadline + 1))).toBe(false);
  });

  it("closes at the end of 20 Dec 2026 in Brunei time", () => {
    expect(new Date(deadline).toISOString()).toBe("2026-12-20T15:59:59.000Z");
  });
});

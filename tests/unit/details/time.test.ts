import { describe, expect, it } from "vitest";
import { EVENT } from "../../../shared/config/event";
import { formatArrivalTime, formatEventDate, venueClock } from "../../../src/features/details/time";

// Venue time is UTC+8 all year (no daylight saving), so 11:15 UTC is 19:15 in Brunei.
const at = (hh: number, mm = 0) => new Date(Date.UTC(2026, 11, 28, hh - 8 + 24, mm));

describe("venueClock", () => {
  it("reads the clock in the venue timezone, whatever the machine's timezone is", () => {
    expect(venueClock(new Date("2026-12-28T11:15:00Z"))).toEqual({ hour: 19, minute: 15 });
    expect(venueClock(new Date("2026-12-28T19:15:00+08:00"))).toEqual({ hour: 19, minute: 15 });
    expect(venueClock(new Date("2026-12-28T16:30:00Z"))).toEqual({ hour: 0, minute: 30 });
  });
});

describe("formatArrivalTime", () => {
  it("shows the event's 19:15 as the approved copy in both languages", () => {
    const start = new Date(EVENT.startsAt);
    expect(formatArrivalTime(start, "ms")).toBe("7.15 malam");
    expect(formatArrivalTime(start, "en")).toBe("7:15 PM");
  });

  it("uses the right Malay period of day", () => {
    expect(formatArrivalTime(at(0, 30), "ms")).toBe("12.30 pagi");
    expect(formatArrivalTime(at(7, 5), "ms")).toBe("7.05 pagi");
    expect(formatArrivalTime(at(12), "ms")).toBe("12.00 tengah hari");
    expect(formatArrivalTime(at(13, 59), "ms")).toBe("1.59 tengah hari");
    expect(formatArrivalTime(at(14), "ms")).toBe("2.00 petang");
    expect(formatArrivalTime(at(18, 59), "ms")).toBe("6.59 petang");
    expect(formatArrivalTime(at(19), "ms")).toBe("7.00 malam");
    expect(formatArrivalTime(at(23, 45), "ms")).toBe("11.45 malam");
  });

  it("uses AM and PM in English, with 12 for midnight and noon", () => {
    expect(formatArrivalTime(at(0, 30), "en")).toBe("12:30 AM");
    expect(formatArrivalTime(at(7, 5), "en")).toBe("7:05 AM");
    expect(formatArrivalTime(at(12), "en")).toBe("12:00 PM");
    expect(formatArrivalTime(at(23, 45), "en")).toBe("11:45 PM");
  });
});

describe("formatEventDate", () => {
  it("formats the event day in each language", () => {
    expect(formatEventDate("ms")).toMatch(/^Isnin, 28 Disember 2026$/i);
    expect(formatEventDate("en-GB")).toBe("Monday, 28 December 2026");
  });
});

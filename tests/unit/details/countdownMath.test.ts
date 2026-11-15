import { describe, expect, it } from "vitest";
import { countdownParts, countdownPhase, pad2 } from "../../../src/features/details/countdownMath";

const target = Date.parse("2026-12-28T19:15:00+08:00");
const sec = 1000;
const day = 86400 * sec;

describe("countdownParts", () => {
  it("splits the remaining time into days, hours, minutes and seconds", () => {
    const now = target - (12 * day + 3 * 3600 * sec + 4 * 60 * sec + 5 * sec);
    expect(countdownParts(now, target)).toEqual({ days: 12, hours: 3, minutes: 4, seconds: 5 });
  });

  it("rounds partial seconds down, so it never shows 00 while time remains", () => {
    expect(countdownParts(target - 1, target)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(countdownParts(target - 1500, target).seconds).toBe(1);
    expect(countdownParts(target - 59 * sec, target).seconds).toBe(59);
    expect(countdownParts(target - 60 * sec, target)).toMatchObject({ minutes: 1, seconds: 0 });
  });

  it("never goes negative after the start", () => {
    expect(countdownParts(target + 5 * day, target)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("rolls over at the hour and day boundaries", () => {
    expect(countdownParts(target - day, target)).toMatchObject({ days: 1, hours: 0 });
    expect(countdownParts(target - day + sec, target)).toMatchObject({ days: 0, hours: 23, minutes: 59, seconds: 59 });
  });
});

describe("countdownPhase (days are venue days, UTC+8)", () => {
  it("is before until the start, to the millisecond", () => {
    expect(countdownPhase(target - 1, target)).toBe("before");
    expect(countdownPhase(target - 30 * day, target)).toBe("before");
  });

  it("is today from the start to the end of the event day", () => {
    expect(countdownPhase(target, target)).toBe("today");
    expect(countdownPhase(Date.parse("2026-12-28T23:59:59.999+08:00"), target)).toBe("today");
  });

  it("is after from the first moment of the next venue day", () => {
    expect(countdownPhase(Date.parse("2026-12-29T00:00:00+08:00"), target)).toBe("after");
    expect(countdownPhase(target + 30 * day, target)).toBe("after");
  });

  it("uses the venue's calendar, not UTC or the machine's", () => {
    // 16:00 UTC on the 28th is already 00:00 on the 29th in Brunei.
    expect(countdownPhase(Date.parse("2026-12-28T16:00:00Z"), target)).toBe("after");
    expect(countdownPhase(Date.parse("2026-12-28T15:59:59Z"), target)).toBe("today");
  });
});

describe("pad2", () => {
  it("pads to two digits and leaves longer numbers alone", () => {
    expect([pad2(0), pad2(7), pad2(10), pad2(123)]).toEqual(["00", "07", "10", "123"]);
  });
});

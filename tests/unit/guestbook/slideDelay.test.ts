import { describe, expect, it } from "vitest";
import { slideDelay } from "../../../src/features/guestbook/slideDelay";

describe("slideDelay", () => {
  it("gives a short wish the minimum time", () => {
    expect(slideDelay("")).toBe(6000);
    expect(slideDelay("Tahniah!")).toBe(6000);
  });

  it("gives a longer wish more time to read", () => {
    expect(slideDelay("x".repeat(100))).toBe(9000);
    expect(slideDelay("x".repeat(160))).toBeGreaterThan(
      slideDelay("x".repeat(100)),
    );
  });

  it("never exceeds the maximum, even for the longest wish allowed", () => {
    expect(slideDelay("x".repeat(500))).toBe(14000);
    expect(slideDelay("x".repeat(5000))).toBe(14000);
  });
});

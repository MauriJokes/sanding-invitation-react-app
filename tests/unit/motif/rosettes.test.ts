import { describe, expect, it } from "vitest";
import { bandRosettes, doorRosettes, ROSETTE_PX, TILE_PX } from "../../../src/features/motif/rosettes";

describe("doorRosettes", () => {
  it("places rosettes on the tile grid, centred on the tile corners", () => {
    for (const r of doorRosettes("left", 390, 844)) {
      expect((r.x + ROSETTE_PX / 2) % TILE_PX).toBeCloseTo(0, 6);
      expect((r.y + ROSETTE_PX / 2) % TILE_PX).toBeCloseTo(0, 6);
    }
  });

  it("covers the whole door but skips the corners hidden under the navy wedge", () => {
    const all = Math.ceil(Math.ceil(390 / 2) / TILE_PX + 1) * Math.ceil(844 / TILE_PX + 1);
    const left = doorRosettes("left", 390, 844);
    expect(left.length).toBeGreaterThan(0);
    expect(left.length).toBeLessThan(all);
    // nothing sits in the middle band near the seam, where the wedge is tallest
    const seamSide = left.filter((r) => r.x + ROSETTE_PX / 2 > 100);
    expect(seamSide.every((r) => Math.abs((r.y + ROSETTE_PX / 2) / 844 - 0.5) >= 0.412 - 30 / 844)).toBe(true);
  });

  it("is deterministic, unique and mixes speeds and directions", () => {
    const a = doorRosettes("right", 1280, 800);
    expect(doorRosettes("right", 1280, 800)).toEqual(a);
    expect(new Set(a.map((r) => r.key)).size).toBe(a.length);
    expect(new Set(a.map((r) => r.duration)).size).toBeGreaterThan(3);
    expect(a.some((r) => r.reverse)).toBe(true);
    expect(a.some((r) => !r.reverse)).toBe(true);
    expect(a.every((r) => r.duration >= 36 && r.duration <= 84)).toBe(true);
  });

  it("keeps a phone-sized cover within the performance budget", () => {
    const total = doorRosettes("left", 390, 844).length + doorRosettes("right", 390, 844).length;
    expect(total).toBeLessThanOrEqual(60);
  });
});

describe("bandRosettes", () => {
  it("fills the band width on the tile grid in the requested number of rows", () => {
    const band = bandRosettes(390);
    const cols = Math.ceil(390 / TILE_PX) + 1;
    expect(band).toHaveLength(cols * 3);
    expect(new Set(band.map((r) => r.key)).size).toBe(band.length);
    expect(Math.max(...band.map((r) => r.x + ROSETTE_PX / 2))).toBeGreaterThanOrEqual(390);
    expect(new Set(band.map((r) => r.y)).size).toBe(3);
    expect(bandRosettes(390, 2)).toHaveLength(cols * 2);
  });

  it("mixes speeds and directions like the gate", () => {
    const band = bandRosettes(1280);
    expect(band.some((r) => r.reverse)).toBe(true);
    expect(band.some((r) => !r.reverse)).toBe(true);
    expect(new Set(band.map((r) => r.duration)).size).toBeGreaterThan(3);
  });
});

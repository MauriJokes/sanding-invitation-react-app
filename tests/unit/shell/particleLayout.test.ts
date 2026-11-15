import { describe, expect, it } from "vitest";
import { makeParticles, PARTICLES_DESKTOP, PARTICLES_PHONE, particleCount } from "../../../src/features/shell/particleLayout";

describe("particles", () => {
  it("uses fewer on phones than on desktop (14 and 24)", () => {
    expect(particleCount(375)).toBe(PARTICLES_PHONE);
    expect(particleCount(639)).toBe(PARTICLES_PHONE);
    expect(particleCount(640)).toBe(PARTICLES_DESKTOP);
    expect([PARTICLES_PHONE, PARTICLES_DESKTOP]).toEqual([14, 24]);
  });

  it("is deterministic and keeps every value inside the approved ranges", () => {
    const a = makeParticles(24);
    expect(makeParticles(24)).toEqual(a);
    expect(a).toHaveLength(24);
    for (const p of a) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThan(100);
      expect(p.opacity).toBeGreaterThanOrEqual(0.35);
      expect(p.opacity).toBeLessThanOrEqual(0.8);
      expect(p.fallSeconds).toBeGreaterThanOrEqual(14);
      expect(p.fallSeconds).toBeLessThanOrEqual(28);
      expect(p.driftSeconds).toBeGreaterThanOrEqual(3);
      expect(p.driftSeconds).toBeLessThanOrEqual(6);
      expect(p.fallDelay).toBeLessThanOrEqual(0);
    }
  });

  it("cycles through the three shapes", () => {
    const kinds = makeParticles(14).map((p) => p.kind);
    expect(new Set(kinds)).toEqual(new Set(["gold", "ivory", "rosette"]));
    expect(kinds.slice(0, 3)).toEqual(["gold", "ivory", "rosette"]);
  });

  it("does not repeat the same layout for a different seed", () => {
    expect(makeParticles(24, 1)).not.toEqual(makeParticles(24, 2));
  });
});

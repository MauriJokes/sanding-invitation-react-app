export type ParticleKind = "gold" | "ivory" | "rosette";

export interface Particle {
  key: number;
  kind: ParticleKind;
  left: number;
  opacity: number;
  fallSeconds: number;
  fallDelay: number;
  driftSeconds: number;
}

const KINDS: readonly ParticleKind[] = ["gold", "ivory", "rosette"];

/** Small deterministic generator (mulberry32) so the layout is stable across renders and in tests. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PARTICLES_PHONE = 14;
export const PARTICLES_DESKTOP = 24;

export function particleCount(viewportWidth: number): number {
  return viewportWidth < 640 ? PARTICLES_PHONE : PARTICLES_DESKTOP;
}

export function makeParticles(count: number, seed = 7): Particle[] {
  const rand = random(seed);
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    kind: KINDS[i % KINDS.length] ?? "gold",
    left: rand() * 100,
    opacity: 0.35 + rand() * 0.45,
    fallSeconds: 14 + rand() * 14,
    fallDelay: -rand() * 26,
    driftSeconds: 3 + rand() * 3,
  }));
}

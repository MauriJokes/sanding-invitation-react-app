export type DoorSide = "left" | "right";

export interface Rosette {
  key: string;
  x: number;
  y: number;
  duration: number;
  reverse: boolean;
}

/** One tile is 120 units drawn at 84 px; a rosette sits on every tile corner and is 50.4 px wide. */
export const TILE_PX = 84;
export const ROSETTE_PX = 50.4;

/**
 * Rosettes for one gate door, on the same grid as the tile background. Those fully hidden under the navy
 * wedge behind the plaque are skipped. Speeds and directions are mixed deterministically.
 */
export function doorRosettes(side: DoorSide, viewportWidth: number, viewportHeight: number): Rosette[] {
  const doorWidth = Math.ceil(viewportWidth / 2);
  const cols = Math.ceil(doorWidth / TILE_PX) + 1;
  const rows = Math.ceil(viewportHeight / TILE_PX) + 1;
  const result: Rosette[] = [];
  let seq = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * TILE_PX;
      const y = r * TILE_PX;
      const towardSeam = side === "left" ? x / doorWidth : 1 - x / doorWidth;
      const halfHeight = 0.16 + 0.252 * Math.min(1, Math.max(0, towardSeam));
      const hidden = Math.abs(y / viewportHeight - 0.5) < halfHeight - 30 / viewportHeight;
      if (hidden) continue;
      result.push({
        key: `${side}-${r}-${c}`,
        x: x - ROSETTE_PX / 2,
        y: y - ROSETTE_PX / 2,
        duration: 36 + ((seq * 13) % 7) * 8,
        reverse: (seq * 7 + 3) % 5 < 2,
      });
      seq++;
    }
  }
  return result;
}

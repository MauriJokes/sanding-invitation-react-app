const BASE_MS = 4000;
const PER_CHARACTER_MS = 50;
const MIN_MS = 6000;
const MAX_MS = 14000;

/** How long a wish stays before auto-play moves on: longer messages get longer to read, within bounds. */
export function slideDelay(message: string): number {
  return Math.min(
    MAX_MS,
    Math.max(MIN_MS, BASE_MS + message.length * PER_CHARACTER_MS),
  );
}

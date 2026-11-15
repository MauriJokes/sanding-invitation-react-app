import { beforeEach, vi } from "vitest";

/**
 * jsdom has no media playback. Without this, a test that presses Buka would hit its "not implemented" error.
 * Tests that care about playback stub the global Audio themselves.
 */
beforeEach(() => {
  if (typeof HTMLMediaElement === "undefined") return;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
});

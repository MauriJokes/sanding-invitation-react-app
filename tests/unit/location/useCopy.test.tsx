// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopy } from "../../../src/features/location/useCopy";

const setClipboard = (value: unknown) => Object.defineProperty(navigator, "clipboard", { configurable: true, value });

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  setClipboard(undefined);
});

const press = (copy: () => void) =>
  act(async () => {
    copy();
    await Promise.resolve();
  });

describe("useCopy", () => {
  it("writes exactly the given text and reports copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const { result } = renderHook(() => useCopy("The Hotel, 1 Road"));
    expect(result.current.state).toBe("idle");
    await press(result.current.copy);
    expect(writeText).toHaveBeenCalledExactlyOnceWith("The Hotel, 1 Road");
    expect(result.current.state).toBe("copied");
  });

  it("goes back to idle after the reset time, and not before", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => useCopy("x", 2500));
    await press(result.current.copy);
    act(() => void vi.advanceTimersByTime(2499));
    expect(result.current.state).toBe("copied");
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current.state).toBe("idle");
  });

  it("restarts the timer when pressed again", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result } = renderHook(() => useCopy("x", 1000));
    await press(result.current.copy);
    act(() => void vi.advanceTimersByTime(800));
    await press(result.current.copy);
    act(() => void vi.advanceTimersByTime(800));
    expect(result.current.state).toBe("copied");
    act(() => void vi.advanceTimersByTime(200));
    expect(result.current.state).toBe("idle");
  });

  it("reports failed when the clipboard refuses", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("NotAllowedError")) });
    const { result } = renderHook(() => useCopy("x"));
    await press(result.current.copy);
    expect(result.current.state).toBe("failed");
  });

  it("reports failed, without throwing, when there is no clipboard (insecure page, old browser)", async () => {
    setClipboard(undefined);
    const { result } = renderHook(() => useCopy("x"));
    await press(result.current.copy);
    expect(result.current.state).toBe("failed");
    setClipboard({});
    await press(result.current.copy);
    expect(result.current.state).toBe("failed");
  });

  it("clears its timer when unmounted", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    const { result, unmount } = renderHook(() => useCopy("x"));
    await press(result.current.copy);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

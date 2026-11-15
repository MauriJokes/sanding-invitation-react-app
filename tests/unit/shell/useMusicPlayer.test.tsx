// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MusicButton } from "../../../src/features/shell/MusicButton";
import { useMusicPlayer } from "../../../src/features/music/useMusicPlayer";
import { MUSIC_SRC } from "../../../src/features/music/track";
import { I18nProvider } from "../../../src/i18n/I18nProvider";

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  static playResult: "ok" | "reject" = "ok";
  paused = true;
  loop = false;
  volume = 1;
  preload = "";
  src = "";
  pauseCalls = 0;
  constructor() {
    super();
    FakeAudio.instances.push(this);
  }
  play(): Promise<void> {
    if (FakeAudio.playResult === "reject") return Promise.reject(new Error("NotAllowedError"));
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }
  pause() {
    this.pauseCalls++;
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
}

/** Press and let the play() promise settle. */
const press = (toggle: () => void) =>
  act(async () => {
    toggle();
    await Promise.resolve();
  });

beforeEach(() => {
  FakeAudio.instances = [];
  FakeAudio.playResult = "ok";
  vi.stubGlobal("Audio", FakeAudio);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.lang = "";
});

describe("useMusicPlayer", () => {
  it("does nothing until the first press: no element, no request, no autoplay", () => {
    const { result } = renderHook(() => useMusicPlayer());
    expect(FakeAudio.instances).toHaveLength(0);
    expect(result.current).toMatchObject({ playing: false, unavailable: false });
  });

  it("plays the configured track on the first press, looping, without preloading ahead of time", async () => {
    const { result } = renderHook(() => useMusicPlayer());
    await press(result.current.toggle);
    const [el] = FakeAudio.instances;
    expect(FakeAudio.instances).toHaveLength(1);
    expect(el?.src).toBe(MUSIC_SRC);
    expect(el?.loop).toBe(true);
    expect(el?.preload).toBe("none");
    expect(el?.volume).toBeGreaterThan(0);
    expect(el?.volume).toBeLessThan(1);
    expect(result.current.playing).toBe(true);
  });

  it("pauses on the second press and resumes on the third, reusing one element", async () => {
    const { result } = renderHook(() => useMusicPlayer());
    await press(result.current.toggle);
    await press(result.current.toggle);
    expect(result.current.playing).toBe(false);
    await press(result.current.toggle);
    expect(result.current.playing).toBe(true);
    expect(FakeAudio.instances).toHaveLength(1);
  });

  it("follows the element when something else pauses it (headphones, system controls)", async () => {
    const { result } = renderHook(() => useMusicPlayer());
    await press(result.current.toggle);
    act(() => void FakeAudio.instances[0]?.pause());
    expect(result.current.playing).toBe(false);
  });

  it("reports unavailable, without throwing, when the browser refuses or the file is missing", async () => {
    FakeAudio.playResult = "reject";
    const { result } = renderHook(() => useMusicPlayer());
    await press(result.current.toggle);
    expect(result.current).toMatchObject({ playing: false, unavailable: true });
  });

  it("reports unavailable when the file fails to load", async () => {
    const { result } = renderHook(() => useMusicPlayer());
    await press(result.current.toggle);
    act(() => void FakeAudio.instances[0]?.dispatchEvent(new Event("error")));
    expect(result.current).toMatchObject({ playing: false, unavailable: true });
  });

  it("stops the music when the page unmounts", async () => {
    const { result, unmount } = renderHook(() => useMusicPlayer());
    await press(result.current.toggle);
    const el = FakeAudio.instances[0]!;
    unmount();
    expect(el.paused).toBe(true);
  });
});

describe("MusicButton with an unavailable track", () => {
  const renderButton = (player: Parameters<typeof MusicButton>[0]["player"]) =>
    render(
      <I18nProvider>
        <MusicButton player={player} />
      </I18nProvider>,
    );

  it("says so, looks dimmed and no longer toggles", () => {
    const toggle = vi.fn();
    renderButton({ playing: false, unavailable: true, toggle });
    const button = screen.getByRole("button", { name: "Muzik tidak tersedia" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(button);
    expect(toggle).not.toHaveBeenCalled();
  });

  it("toggles normally otherwise", () => {
    const toggle = vi.fn();
    renderButton({ playing: false, unavailable: false, toggle });
    fireEvent.click(screen.getByRole("button", { name: "Mainkan muzik" }));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});

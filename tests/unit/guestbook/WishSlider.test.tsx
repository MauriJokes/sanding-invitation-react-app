// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicGuestbookEntry } from "../../../shared/guestbook/constants";
import { WishSlider } from "../../../src/features/guestbook/WishSlider";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { strings } from "../../../src/i18n/strings";
import { embla } from "./fakeEmbla";

vi.mock("embla-carousel-react", async () => ({
  default: (await import("./fakeEmbla")).default,
}));

const ms = strings.ms;
const entry = (n: number, message = `Wish ${n}`): PublicGuestbookEntry => ({
  displayName: `Guest ${n}`,
  message,
  createdAt: `2026-12-01T10:00:0${n}.000Z`,
});
const three = [entry(1), entry(2), entry(3)];

type Props = Partial<Parameters<typeof WishSlider>[0]>;
const props = (over: Props = {}) => ({
  entries: three,
  hasMore: false,
  loadingMore: false,
  moreFailed: false,
  onLoadMore: vi.fn(),
  resetSignal: 0,
  suspended: false,
  ...over,
});
const tree = (over: Props) => (
  <I18nProvider initialLang="ms">
    <WishSlider {...props(over)} />
  </I18nProvider>
);
const show = (over: Props = {}) => render(tree(over));

const counter = () => document.querySelector("p.tabular-nums")?.textContent;
const region = () =>
  screen.getByRole("region", { name: ms.guestbookListLabel });
const pause = () => screen.getByRole("button", { name: ms.guestbookPause });
const play = () => screen.getByRole("button", { name: ms.guestbookPlay });
const next = () =>
  screen.getByRole<HTMLButtonElement>("button", { name: ms.guestbookNext });
const prev = () =>
  screen.getByRole<HTMLButtonElement>("button", { name: ms.guestbookPrev });
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
  act(() => void document.dispatchEvent(new Event("visibilitychange")));
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  setHidden(false);
});

describe("controls", () => {
  it.each([
    ["ms", strings.ms],
    ["en", strings.en],
  ] as const)(
    "shows the message, recipient and sender in the %s postcard",
    (lang, copy) => {
      const message = "<script>alert('hello')</script>" + "x".repeat(400);
      const displayName = "A".repeat(60);
      render(
        <I18nProvider initialLang={lang}>
          <WishSlider
            {...props({ entries: [{ ...entry(1, message), displayName }] })}
          />
        </I18nProvider>,
      );
      const card = screen.getByRole("group", {
        name: copy.guestbookSlideLabel(1, 1),
      });
      expect(within(card).getByText(copy.guestbookPostcard)).toBeTruthy();
      expect(within(card).getByText(copy.guestbookTo)).toBeTruthy();
      expect(within(card).getByText("Izyan & Adam")).toBeTruthy();
      expect(within(card).getByText(copy.guestbookFrom)).toBeTruthy();
      expect(within(card).getByText(displayName)).toBeTruthy();
      expect(within(card).getByText(message).tagName).toBe("BLOCKQUOTE");
      expect(card.querySelector("script")).toBeNull();
    },
  );

  it("renders a decorative square stamp on each wish", () => {
    show();
    const stamps = region().querySelectorAll('img[alt=""]');
    expect(stamps).toHaveLength(three.length);
    for (const stamp of stamps) {
      expect(stamp.getAttribute("width")).toBe("1000");
      expect(stamp.getAttribute("height")).toBe("1000");
    }
  });

  it("is a labelled carousel with a counter, a progress bar and arrows", () => {
    show();
    expect(region().getAttribute("aria-roledescription")).toBe("carousel");
    expect(counter()).toBe("01 / 03");
    expect(prev().disabled).toBe(true);
    expect(next().disabled).toBe(false);
  });

  it("moves with the arrows, and disables each at its end", () => {
    show();
    fireEvent.click(next());
    expect(embla.api?.scrollNext).toHaveBeenCalledWith(false);
    expect(counter()).toBe("02 / 03");
    expect(prev().disabled).toBe(false);
    fireEvent.click(next());
    expect(counter()).toBe("03 / 03");
    expect(next().disabled).toBe(true);
    fireEvent.click(prev());
    expect(embla.api?.scrollPrev).toHaveBeenCalledWith(false);
    expect(counter()).toBe("02 / 03");
  });

  it("marks the count with a plus while older wishes are still to be loaded", () => {
    show({ hasMore: true });
    expect(counter()).toBe("01 / 03+");
  });

  it("shows no controls and does not auto-play for one wish", () => {
    show({ entries: [entry(1)] });
    expect(screen.queryByRole("button", { name: ms.guestbookNext })).toBeNull();
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
  });

  it("returns to the newest wish when asked", () => {
    const { rerender } = show();
    fireEvent.click(next());
    expect(embla.api?.scrollTo).not.toHaveBeenCalled();
    rerender(tree({ resetSignal: 1 }));
    expect(embla.api?.scrollTo).toHaveBeenCalledExactlyOnceWith(0, false);
    expect(counter()).toBe("01 / 03");
  });

  it("offers a retry when an older page could not be loaded", () => {
    const onLoadMore = vi.fn();
    show({ hasMore: true, moreFailed: true, onLoadMore });
    expect(screen.getByRole("alert").textContent).toBe(ms.guestbookLoadFailed);
    fireEvent.click(screen.getByRole("button", { name: ms.retry }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

describe("loading older wishes", () => {
  it("asks for the next page when the wish on screen is within three of the end", () => {
    const onLoadMore = vi.fn();
    show({
      entries: [entry(1), entry(2), entry(3), entry(4), entry(5)],
      hasMore: true,
      onLoadMore,
    });
    expect(onLoadMore).not.toHaveBeenCalled();
    fireEvent.click(next());
    expect(onLoadMore).not.toHaveBeenCalled();
    fireEvent.click(next());
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["there is nothing more", { hasMore: false }],
    ["a page is already loading", { hasMore: true, loadingMore: true }],
    ["the last attempt failed", { hasMore: true, moreFailed: true }],
  ])("does not ask when %s", (_name, over) => {
    const onLoadMore = vi.fn();
    show({ ...over, onLoadMore });
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

describe("auto-play", () => {
  it("moves on after the minimum time for a short wish, and not before", () => {
    show();
    wait(5999);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    wait(1);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
    expect(counter()).toBe("02 / 03");
  });

  it("waits longer on a long wish", () => {
    show({ entries: [entry(1, "x".repeat(500)), entry(2)] });
    wait(13_999);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    wait(1);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("keeps going from wish to wish, and returns to the first after the last", () => {
    show();
    wait(6000);
    wait(6000);
    expect(counter()).toBe("03 / 03");
    wait(6000);
    expect(embla.api?.scrollTo).toHaveBeenCalledWith(0, false);
    expect(counter()).toBe("01 / 03");
  });

  it("does not wrap round while older wishes are still to be loaded", () => {
    show({ hasMore: true });
    wait(6000);
    wait(6000);
    expect(counter()).toBe("03 / 03+");
    wait(60_000);
    expect(embla.api?.scrollTo).not.toHaveBeenCalled();
    expect(counter()).toBe("03 / 03+");
  });

  it("carries on when the older wishes arrive", () => {
    const { rerender } = show({ hasMore: true });
    wait(6000);
    wait(6000);
    rerender(tree({ hasMore: false, entries: [...three, entry(4)] }));
    act(() => void embla.api?.emit("reInit"));
    wait(6000);
    expect(counter()).toBe("04 / 04");
  });

  it("is paused with a Play button, and the pause is announced politely", () => {
    show();
    expect(
      region().querySelector("[aria-live]")?.getAttribute("aria-live"),
    ).toBe("off");
    fireEvent.click(pause());
    expect(
      region().querySelector("[aria-live]")?.getAttribute("aria-live"),
    ).toBe("polite");
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    fireEvent.click(play());
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
    expect(pause()).toBeTruthy();
  });

  it("pauses while a mouse is over the slider and resumes when it leaves", () => {
    show();
    fireEvent.pointerEnter(region(), { pointerType: "mouse" });
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    fireEvent.pointerLeave(region(), { pointerType: "mouse" });
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("is not stopped by a touch, which has no hover to end it", () => {
    show();
    fireEvent.pointerEnter(region(), { pointerType: "touch" });
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("holds while the guest is dragging and resumes when they let go", () => {
    show();
    act(() => void embla.api?.emit("pointerDown"));
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    act(() => void embla.api?.emit("pointerUp"));
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("waits while something else has the guest's attention (the pop-up), then resumes", () => {
    const { rerender } = show({ suspended: true });
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    rerender(tree({ suspended: false }));
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("pauses while the tab is in the background", () => {
    show();
    setHidden(true);
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    setHidden(false);
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });

  it("restarts the wait after the guest moves it by hand", () => {
    show();
    wait(5000);
    fireEvent.click(next());
    wait(5999);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
    wait(1);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(2);
  });
});

describe("when the slider is off screen", () => {
  let notify: (visible: boolean) => void = () => undefined;
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          callback: (entries: { isIntersecting: boolean }[]) => void,
        ) {
          notify = (visible) =>
            act(() => callback([{ isIntersecting: visible }]));
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  it("does not advance until it is on screen, and stops when it leaves", () => {
    show();
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
    notify(true);
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
    notify(false);
    wait(60_000);
    expect(embla.api?.scrollNext).toHaveBeenCalledTimes(1);
  });
});

describe("reduced motion", () => {
  beforeEach(() =>
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );

  it("starts paused, so nothing moves until the guest chooses to play", () => {
    show();
    expect(play()).toBeTruthy();
    wait(60_000);
    expect(embla.api?.scrollNext).not.toHaveBeenCalled();
  });

  it("changes wish without sliding, by hand and in auto-play", () => {
    show();
    fireEvent.click(next());
    expect(embla.api?.scrollNext).toHaveBeenLastCalledWith(true);
    fireEvent.click(play());
    wait(6000);
    expect(embla.api?.scrollNext).toHaveBeenLastCalledWith(true);
  });
});

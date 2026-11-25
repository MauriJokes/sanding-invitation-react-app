// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT } from "../../../shared/config/event";
import { App } from "../../../src/App";
import { OPEN_MS, OPEN_REDUCED_MS } from "../../../src/features/cover/Cover";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { configReply, mockFetch } from "../rsvp/helpers";

const renderApp = () =>
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );

const pageWrapper = () =>
  screen.getByRole("main", { hidden: true }).parentElement!;

function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch((call) =>
    call.path === "/api/guestbook"
      ? {
          status: 200,
          json: { data: { entries: [], nextCursor: null }, error: null },
        }
      : configReply(2),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.lang = "";
  document.documentElement.className = "";
});

describe("Cover", () => {
  it("shows the plaque with the event, names, date and a focused Buka button", () => {
    renderApp();
    const cover = screen.getByRole("region", { name: "Muka depan jemputan" });
    expect(cover.textContent).toContain(EVENT.title);
    expect(cover.textContent).toContain("Izyan");
    expect(cover.textContent).toContain("Adam");
    expect(cover.textContent).toContain("28 Disember 2026");
    const open = screen.getByRole("button", { name: "Buka" });
    expect(document.activeElement).toBe(open);
    expect(cover.getAttribute("data-state")).toBe("closed");
  });

  it("keeps the page inert and the scroll locked until the gate has opened", () => {
    renderApp();
    expect(pageWrapper().hasAttribute("inert")).toBe(true);
    expect(document.documentElement.classList.contains("cover-open")).toBe(
      true,
    );
  });

  it("opens the gate, then removes the cover, unlocks the page and focuses the heading", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    const cover = screen.getByRole("region", { name: "Muka depan jemputan" });
    expect(cover.getAttribute("data-state")).toBe("opening");
    expect(pageWrapper().hasAttribute("inert")).toBe(true);

    act(() => void vi.advanceTimersByTime(OPEN_MS - 1));
    expect(
      screen.queryByRole("region", { name: "Muka depan jemputan" }),
    ).not.toBeNull();
    act(() => void vi.advanceTimersByTime(1));

    expect(
      screen.queryByRole("region", { name: "Muka depan jemputan" }),
    ).toBeNull();
    expect(pageWrapper().hasAttribute("inert")).toBe(false);
    expect(document.documentElement.classList.contains("cover-open")).toBe(
      false,
    );
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { level: 1 }),
    );
  });

  it("moves focus to the heading only once the page is no longer inert", () => {
    const states: boolean[] = [];
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called back with the right `this` below
    const focus = HTMLElement.prototype.focus;
    vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
      this: HTMLElement,
      options,
    ) {
      if (this.tagName === "H1")
        states.push(pageWrapper().hasAttribute("inert"));
      focus.call(this, options);
    });
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    act(() => void vi.advanceTimersByTime(OPEN_MS));
    expect(states).toEqual([false]);
    vi.restoreAllMocks();
  });

  it("uses the short crossfade timing when the visitor prefers reduced motion", () => {
    stubReducedMotion(true);
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    act(() => void vi.advanceTimersByTime(OPEN_REDUCED_MS));
    expect(
      screen.queryByRole("region", { name: "Muka depan jemputan" }),
    ).toBeNull();
    expect(pageWrapper().hasAttribute("inert")).toBe(false);
  });

  it("ignores a second press while opening", () => {
    renderApp();
    const open = screen.getByRole("button", { name: "Buka" });
    fireEvent.click(open);
    expect((open as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(open);
    act(() => void vi.advanceTimersByTime(OPEN_MS));
    expect(
      screen.queryByRole("region", { name: "Muka depan jemputan" }),
    ).toBeNull();
  });

  it("renders tile rosettes on both doors and pauses them when the page is hidden", () => {
    renderApp();
    const cover = screen.getByRole("region", { name: "Muka depan jemputan" });
    expect(cover.querySelectorAll(".cover-door-left .ros").length).toBeGreaterThan(0);
    expect(cover.querySelectorAll(".cover-door-right .ros").length).toBeGreaterThan(0);
    expect(cover.getAttribute("data-paused")).toBeNull();
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(cover.getAttribute("data-paused")).toBe("true");
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(cover.getAttribute("data-paused")).toBeNull();
  });

  it("follows the language: English labels and date format", () => {
    render(
      <I18nProvider initialLang="en">
        <App />
      </I18nProvider>,
    );
    const cover = screen.getByRole("region", { name: "Invitation cover" });
    expect(cover.textContent).toContain("28 December 2026");
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
  });

  it("keeps the botanical artwork and monogram decorative, with Buka as the only control", () => {
    renderApp();
    const cover = screen.getByRole("region", { name: "Muka depan jemputan" });
    const artwork = cover.querySelectorAll("img");
    expect(artwork.length).toBeGreaterThan(2);
    artwork.forEach((image) => expect(image.getAttribute("alt")).toBe(""));
    expect(
      cover.querySelector(".cover-monogram")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(cover.querySelectorAll("button, a, input").length).toBe(1);
  });
});

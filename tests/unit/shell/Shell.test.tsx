// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../../src/App";
import { OPEN_MS } from "../../../src/features/cover/Cover";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { configReply, mockFetch } from "../rsvp/helpers";

const renderApp = () =>
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
const hero = () => screen.getByRole("heading", { level: 1, hidden: true }).closest("section")!;

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch((call) =>
    call.path === "/api/guestbook" ? { status: 200, json: { data: { entries: [], nextCursor: null }, error: null } } : configReply(2),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.lang = "";
  document.documentElement.className = "";
});

describe("Shell", () => {
  it("starts the hero entrance when Buka is pressed, in step with the doors rather than after them", () => {
    renderApp();
    expect(hero().getAttribute("data-intro")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    expect(hero().getAttribute("data-intro")).toBe("play");
    expect(screen.queryByRole("region", { name: "Muka depan jemputan" })).not.toBeNull();
  });

  it("starts the music from the Buka press itself, once, and never before it", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    renderApp();
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    expect(play).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(OPEN_MS * 3));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("opens the gate normally when the music cannot start, and says the music is unavailable", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("NotAllowedError"));
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    await act(async () => {
      await Promise.resolve();
    });
    act(() => void vi.advanceTimersByTime(OPEN_MS));
    expect(screen.queryByRole("region", { name: "Muka depan jemputan" })).toBeNull();
    expect(screen.getByRole("button", { name: "Muzik tidak tersedia" })).toBeTruthy();
    expect(hero().getAttribute("data-intro")).toBe("play");
  });

  it("links the hero's scroll cue to the details section", () => {
    renderApp();
    const cue = screen.getByRole("link", { name: "Lihat butiran", hidden: true });
    expect(cue.getAttribute("href")).toBe("#details");
    expect(document.getElementById("details")).not.toBeNull();
  });

  it("mounts the drifting particles only after the gate has opened", () => {
    renderApp();
    expect(document.querySelector(".particles")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    expect(document.querySelector(".particles")).toBeNull();
    act(() => void vi.advanceTimersByTime(OPEN_MS));
    const layer = document.querySelector(".particles");
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(layer?.children.length).toBe(24);
  });

  it("keeps the navigation unreachable until the gate has opened", () => {
    renderApp();
    const nav = screen.getByRole("navigation", { hidden: true });
    expect(nav.closest("[inert]")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    act(() => void vi.advanceTimersByTime(OPEN_MS));
    expect(screen.getByRole("navigation").closest("[inert]")).toBeNull();
  });

  it("links the bar to all four sections in the approved order, and every link has a target", () => {
    renderApp();
    const bar = screen.getByRole("navigation", { hidden: true });
    const hrefs = Array.from(bar.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["#details", "#rsvp", "#prayer", "#guestbook"]);
    for (const href of hrefs) expect(document.querySelector(href!)).not.toBeNull();
    // the page itself runs in the same order as the bar
    const order = hrefs.map((h) => document.querySelector(h!)!);
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("renders decoration that assistive technology skips", () => {
    renderApp();
    const decoration = hero().querySelectorAll(".hero-corner, .hero-band");
    expect(decoration).toHaveLength(3);
    for (const el of decoration) expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(hero().querySelectorAll(".hero-band .ros").length).toBeGreaterThan(0);
  });

  it("pauses decorative animation while the tab is hidden", () => {
    renderApp();
    expect(document.documentElement.classList.contains("page-hidden")).toBe(false);
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(document.documentElement.classList.contains("page-hidden")).toBe(true);
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(document.documentElement.classList.contains("page-hidden")).toBe(false);
  });

  it("shows the date in the venue timezone and follows the language in the hero", () => {
    renderApp();
    expect(hero().textContent).toContain("Isnin, 28 Disember 2026");
    expect(hero().textContent).toContain("The Rizqun International Hotel");
    fireEvent.click(screen.getAllByRole("button", { name: "Switch language to English", hidden: true })[0]!);
    expect(hero().textContent).toContain("Monday, 28 December 2026");
  });

  it("keeps the title as the one h1, with the names as separate text elements for translators", () => {
    renderApp();
    const h1 = screen.getByRole("heading", { level: 1, hidden: true });
    expect(screen.getAllByRole("heading", { level: 1, hidden: true })).toHaveLength(1);
    expect(h1.textContent).toBe("Izyan & Adam");
    expect(h1.querySelectorAll(":scope > span")).toHaveLength(3);
    expect(h1.getAttribute("tabindex")).toBe("-1");
  });

  it("has a skip link that still reaches the main landmark", () => {
    renderApp();
    const skip = screen.getByRole("link", { name: "Langkau ke kandungan", hidden: true });
    expect(skip.getAttribute("href")).toBe("#main");
    expect(document.getElementById("main")?.tagName).toBe("MAIN");
  });
});

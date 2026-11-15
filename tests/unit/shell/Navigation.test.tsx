// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Navigation } from "../../../src/features/shell/Navigation";
import { I18nProvider } from "../../../src/i18n/I18nProvider";

type Callback = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;
let observers: Array<{ cb: Callback; observed: Element[]; disconnected: boolean }> = [];

class FakeObserver {
  entry: (typeof observers)[number];
  constructor(cb: Callback) {
    this.entry = { cb, observed: [], disconnected: false };
    observers.push(this.entry);
  }
  observe(el: Element) {
    this.entry.observed.push(el);
  }
  disconnect() {
    this.entry.disconnected = true;
  }
}

const player = { playing: false, toggle: vi.fn() };

function setup(ids: readonly string[] = ["rsvp", "guestbook"], lang: "ms" | "en" = "ms") {
  for (const id of ["details", "rsvp", "location", "guestbook"]) {
    const el = document.createElement("section");
    el.id = id;
    document.body.appendChild(el);
  }
  return render(
    <I18nProvider initialLang={lang}>
      <Navigation sectionIds={ids} player={player} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  observers = [];
  player.playing = false;
  player.toggle.mockClear();
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
});

describe("Navigation", () => {
  it("is a labelled landmark that links only to sections that exist", () => {
    setup();
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#rsvp", "#guestbook"]);
    expect(links.map((a) => a.textContent)).toEqual(["RSVP", "Ucapan"]);
  });

  it("keeps the approved order of all four sections once they exist", () => {
    setup(["guestbook", "location", "rsvp", "details"]);
    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#details", "#rsvp", "#location", "#guestbook"]);
    expect(links.map((a) => a.textContent)).toEqual(["Butiran", "RSVP", "Lokasi", "Ucapan"]);
  });

  it("follows the language", () => {
    setup(["details", "rsvp", "location", "guestbook"], "en");
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
    expect(within(screen.getByRole("navigation")).getAllByRole("link").map((a) => a.textContent)).toEqual([
      "Details",
      "RSVP",
      "Location",
      "Wishes",
    ]);
  });

  it("marks the section in view with aria-current, and only that one", () => {
    setup();
    const [obs] = observers;
    expect(obs?.observed.map((e) => e.id)).toEqual(["rsvp", "guestbook"]);
    const link = (name: string) => screen.getByRole("link", { name });
    expect(link("RSVP").getAttribute("aria-current")).toBeNull();

    act(() => obs?.cb([{ isIntersecting: true, target: document.getElementById("rsvp")! }]));
    expect(link("RSVP").getAttribute("aria-current")).toBe("true");
    expect(link("Ucapan").getAttribute("aria-current")).toBeNull();

    act(() => obs?.cb([{ isIntersecting: true, target: document.getElementById("guestbook")! }]));
    expect(link("RSVP").getAttribute("aria-current")).toBeNull();
    expect(link("Ucapan").getAttribute("aria-current")).toBe("true");
  });

  it("ignores sections that leave the viewport", () => {
    setup();
    act(() => observers[0]?.cb([{ isIntersecting: true, target: document.getElementById("rsvp")! }]));
    act(() => observers[0]?.cb([{ isIntersecting: false, target: document.getElementById("guestbook")! }]));
    expect(screen.getByRole("link", { name: "RSVP" }).getAttribute("aria-current")).toBe("true");
  });

  it("stops observing when it unmounts", () => {
    const { unmount } = setup();
    unmount();
    expect(observers[0]?.disconnected).toBe(true);
  });

  it("still renders where IntersectionObserver is missing", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    setup();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("hides on phones while a text field has focus and returns afterwards", () => {
    setup();
    const nav = screen.getByRole("navigation");
    expect(nav.getAttribute("data-typing")).toBeNull();
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    act(() => void input.focus());
    expect(nav.getAttribute("data-typing")).toBe("true");
    act(() => void input.blur());
    expect(nav.getAttribute("data-typing")).toBeNull();
  });

  it("does not hide for checkboxes, radios or buttons", () => {
    setup();
    const nav = screen.getByRole("navigation");
    for (const type of ["checkbox", "radio"]) {
      const input = document.createElement("input");
      input.type = type;
      document.body.appendChild(input);
      act(() => void input.focus());
      expect(nav.getAttribute("data-typing")).toBeNull();
    }
    const button = document.createElement("button");
    document.body.appendChild(button);
    act(() => void button.focus());
    expect(nav.getAttribute("data-typing")).toBeNull();
  });

  it("holds the language switch and the music control", () => {
    setup();
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: "Switch language to English" }));
    expect(within(nav).getByRole("link", { name: "Wishes" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");

    fireEvent.click(within(nav).getByRole("button", { name: "Play music" }));
    expect(player.toggle).toHaveBeenCalledTimes(1);
  });

  it("shows the music state in the label and the icon, not by colour alone", () => {
    const { rerender } = setup();
    const slash = () => screen.getByRole("button", { name: /muzik/i }).querySelectorAll("path").length;
    expect(screen.getByRole("button", { name: "Mainkan muzik" })).toBeTruthy();
    const offPaths = slash();

    player.playing = true;
    rerender(
      <I18nProvider>
        <Navigation sectionIds={["rsvp"]} player={player} />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Jeda muzik" })).toBeTruthy();
    expect(slash()).toBe(offPaths - 1);
  });

  it("gives every icon an empty accessible name so only the label is read", () => {
    setup();
    for (const svg of document.querySelectorAll("nav svg")) expect(svg.getAttribute("aria-hidden")).toBe("true");
  });
});

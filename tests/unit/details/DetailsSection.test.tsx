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
import { EVENT } from "../../../shared/config/event";
import {
  COUPLE,
  HOST_GROUPS,
  ITINERARY,
  ITINERARY_EN,
} from "../../../src/features/details/content";
import { DetailsSection } from "../../../src/features/details/DetailsSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { strings } from "../../../src/i18n/strings";

const renderIt = (lang: "ms" | "en" = "ms") =>
  render(
    <I18nProvider initialLang={lang}>
      <DetailsSection />
    </I18nProvider>,
  );

const setClipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
const press = (el: Element) =>
  act(async () => {
    fireEvent.click(el);
    await Promise.resolve();
  });

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setClipboard(undefined);
  document.documentElement.lang = "";
});

describe("owner-supplied copy", () => {
  it("lists the eight hosts in four pairs, each with the title and the lineage, in the order given", () => {
    const { container } = renderIt();
    expect(HOST_GROUPS).toHaveLength(4);
    for (const group of HOST_GROUPS) expect(group).toHaveLength(2);
    const shown = Array.from(container.querySelectorAll("p"))
      .filter((p) => p.textContent?.startsWith("Yang Mulia"))
      .map((p) => p.textContent);
    expect(shown).toEqual(
      HOST_GROUPS.flat().map(
        (person) => `Yang Mulia${person.name}${person.lineage}`,
      ),
    );
  });

  it("does not show a dress code (owner decision)", () => {
    for (const lang of ["ms", "en"] as const) {
      const { container } = renderIt(lang);
      expect(container.textContent).not.toMatch(
        /Pakaian|Dress Code|Baju (Melayu|Kurung)/i,
      );
      expect(container.querySelector("h3")).toBeNull();
      cleanup();
    }
  });

  it("shows the invitation lines in the chosen language", () => {
    renderIt("ms");
    expect(screen.getByAltText(strings.ms.detailsGreeting)).toBeTruthy();
    expect(screen.getByText(strings.ms.detailsIntro)).toBeTruthy();
    expect(screen.getByText(strings.ms.detailsInvite)).toBeTruthy();
    cleanup();
    renderIt("en");
    expect(screen.getByAltText(strings.en.detailsGreeting)).toBeTruthy();
    expect(screen.getByText(strings.en.detailsIntro)).toBeTruthy();
    expect(screen.getByText(strings.en.detailsInvite)).toBeTruthy();
  });

  it("keeps the opening prayer and the greeting once, without the duplicate Assalamu'alaikum line", () => {
    const { container } = renderIt();
    expect(screen.getAllByText("Ya Qadhi Al-Hajat")).toHaveLength(1);
    expect(screen.getAllByAltText(strings.ms.detailsGreeting)).toHaveLength(1);
    expect(container.textContent).not.toContain(strings.ms.detailsGreeting);
    expect(container.textContent).not.toMatch(/ASSALAMU'ALAIKUM WR\. WB\./i);
  });

  it("presents only the one celebration", () => {
    const { container } = renderIt();
    expect(container.textContent).not.toMatch(/Majlis-Majlis|Akad/i);
  });
});

describe("DetailsSection", () => {
  it("keeps the botanical artwork decorative and outside the reading content", () => {
    const { container } = renderIt();
    const layer = container.querySelector(".details-botanicals");
    const content = container.querySelector(".details-content");
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(layer?.querySelectorAll(".details-stem").length).toBeGreaterThan(30);
    expect(layer?.querySelectorAll(".details-flower")).toHaveLength(3);
    expect(
      Array.from(layer?.querySelectorAll("img") ?? []).every(
        (image) => image.alt === "",
      ),
    ).toBe(true);
    expect(content?.contains(layer ?? null)).toBe(false);
  });

  it("is a labelled section with the id the navigation links to", () => {
    renderIt();
    const section = screen.getByRole("region", { name: "Butiran" });
    expect(section.id).toBe("details");
    expect(
      screen.getByRole("heading", { level: 2, name: "Butiran" }),
    ).toBeTruthy();
  });

  it("shows the couple's full names", () => {
    renderIt();
    for (const name of COUPLE) expect(screen.getByText(name)).toBeTruthy();
    expect(COUPLE[0]).toBe(
      "Dk Izyan Naqiyah binti Pengiran Haji Mohd. Jaludin",
    );
    expect(COUPLE[1]).toBe("Nik Adam Danish bin Nik Joharris");
  });

  it("shows the date (Gregorian and Islamic), the itinerary and the venue with room as a description list", () => {
    const { container } = renderIt();
    const terms = Array.from(container.querySelectorAll("dt")).map(
      (e) => e.textContent,
    );
    expect(terms).toEqual([
      strings.ms.factDate,
      strings.ms.factVenue,
      strings.ms.factItinerary,
    ]);
    const defs = Array.from(container.querySelectorAll("dd"));
    expect(defs).toHaveLength(4);
    expect(defs[0]?.textContent).toBe(strings.ms.normalDate);
    expect(defs[1]?.textContent).toBe(strings.ms.islamicDate);
    expect(defs[0]?.textContent).toMatch(/28 Disember 2026/);
    expect(defs[2]?.textContent).toContain(EVENT.venueName);
    expect(defs[2]?.textContent).toContain(EVENT.venueRoom);
    expect(defs[3]?.querySelectorAll("li")).toHaveLength(ITINERARY.length);
    expect(container.querySelector("address")?.textContent).toBe(
      EVENT.venueAddress,
    );
  });

  it("lists every itinerary entry in order, with the times that were given and no end time", () => {
    const { container } = renderIt();
    const items = Array.from(container.querySelectorAll("li"));
    expect(items).toHaveLength(ITINERARY.length);
    ITINERARY.forEach((entry, index) => {
      expect(items[index]?.textContent).toBe(`${entry.time}${entry.item}`);
    });
    expect(ITINERARY[0]?.time).toBe("7:15 MLM");
    expect(container.textContent).not.toMatch(/hingga|sehingga|until/i);
  });

  it("shows the itinerary in English on the English page, with the same times in the same order", () => {
    const { container } = renderIt("en");
    const items = Array.from(container.querySelectorAll("li"));
    expect(items).toHaveLength(ITINERARY_EN.length);
    ITINERARY_EN.forEach((entry, index) => {
      expect(items[index]?.textContent).toBe(`${entry.time}${entry.item}`);
    });
    expect(ITINERARY_EN).toHaveLength(ITINERARY.length);
    expect(ITINERARY_EN.map((entry) => entry.time !== "")).toEqual(
      ITINERARY.map((entry) => entry.time !== ""),
    );
    expect(ITINERARY_EN[0]?.time).toBe("7:15 PM");
    expect(container.textContent).not.toContain(ITINERARY[0]?.item);
  });

  it("switches every label to English", () => {
    const { container } = renderIt("en");
    expect(
      Array.from(container.querySelectorAll("dt")).map((e) => e.textContent),
    ).toEqual([
      strings.en.factDate,
      strings.en.factVenue,
      strings.en.factItinerary,
    ]);
    expect(Array.from(container.querySelectorAll("dd"))[0]?.textContent).toBe(
      strings.en.normalDate,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Details" }),
    ).toBeTruthy();
  });

  it("has decoration hidden from assistive technology, with no frames or inputs", () => {
    const { container } = renderIt();
    expect(
      container.querySelectorAll("iframe, object, embed, input").length,
    ).toBe(0);
    expect(container.querySelectorAll(".details-content img")).toHaveLength(1);
    // Botanical layer, three rules, and one separator between itinerary entries.
    expect(container.querySelectorAll("div[aria-hidden=true]")).toHaveLength(
      1 + 3 + ITINERARY.length - 1,
    );
  });

  it("shows the greeting as the owner's calligraphy, sized to the screen without shifting the layout", () => {
    renderIt();
    const img = screen.getByAltText(strings.ms.detailsGreeting);
    expect(img.getAttribute("src")).toMatch(/salam-trimmed.*\.png$/);
    expect(img.getAttribute("width")).toBeTruthy();
    expect(img.getAttribute("height")).toBeTruthy();
    expect(img.className).toMatch(/w-\[clamp\(/);
    expect(img.className).toContain("h-auto");
  });

  it("ends with the itinerary, after the venue and its two actions", () => {
    const { container } = renderIt();
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const venue = container.querySelector("address")!;
    const link = screen.getByRole("link", {
      name: new RegExp(strings.ms.locationMapOpen),
    });
    const copy = screen.getByRole("button", { name: strings.ms.locationCopy });
    const firstEntry = container.querySelector("li")!;
    expect(follows(venue, link)).toBe(true);
    expect(follows(copy, firstEntry)).toBe(true);
  });

  it("shows a time label only for the entries that have one, and separates entries with hidden decoration", () => {
    const { container } = renderIt();
    const items = Array.from(container.querySelectorAll("li"));
    items.forEach((li, index) => {
      const entry = ITINERARY[index]!;
      const label = li.querySelector("span:first-child");
      expect(label?.textContent).toBe(entry.time || entry.item);
      expect(li.querySelectorAll("[aria-hidden=true]")).toHaveLength(
        index < items.length - 1 ? 1 : 0,
      );
    });
  });

  it("makes the couple the focus: their names are larger than the body text and the families' are smaller", () => {
    renderIt();
    const size = (el: Element) =>
      /text-\[(?:clamp\()?([\d.]+)rem/.exec(el.className)?.[1];
    const couple = screen.getByText(COUPLE[0]!);
    const family = screen.getByText(HOST_GROUPS[0]![0]!.name).closest("p")!;
    const body = screen.getByText(strings.ms.detailsIntro);
    expect(Number(size(couple))).toBeGreaterThan(Number(size(body)));
    expect(Number(size(family))).toBeLessThan(Number(size(body)));
  });

  it("offers a directions link that opens the owner's map URL in a new tab, safely", () => {
    renderIt();
    const link = screen.getByRole("link", {
      name: new RegExp(strings.ms.locationMapOpen),
    });
    expect(link.getAttribute("href")).toBe(EVENT.directionsUrl);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toContain(strings.ms.locationNewTab);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("puts the two venue actions side by side, in one row", () => {
    renderIt();
    const link = screen.getByRole("link", {
      name: new RegExp(strings.ms.locationMapOpen),
    });
    const button = screen.getByRole("button", {
      name: strings.ms.locationCopy,
    });
    expect(link.parentElement).toBe(button.parentElement);
    expect(link.parentElement?.className).toMatch(/\bflex\b/);
    expect(link.parentElement?.className).not.toMatch(/flex-col|flex-wrap/);
  });

  it("copies the venue and address and announces it politely", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderIt();
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await press(screen.getByRole("button", { name: strings.ms.locationCopy }));
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      `${EVENT.venueName}, ${EVENT.venueAddress}`,
    );
    expect(status.textContent).toBe(strings.ms.locationCopied);
    act(() => void vi.advanceTimersByTime(2500));
    expect(status.textContent).toBe("");
  });

  it("tells the guest to copy by hand when the clipboard is unavailable", async () => {
    setClipboard(undefined);
    renderIt("en");
    await press(screen.getByRole("button", { name: strings.en.locationCopy }));
    expect(screen.getByRole("status").textContent).toBe(
      strings.en.locationCopyFailed,
    );
  });

  it("keeps each piece of text in its own element so machine translation cannot break it", () => {
    const { container } = renderIt();
    for (const el of container.querySelectorAll(
      "p, dd, dt, h2, h3, li, a, button",
    )) {
      const bare = Array.from(el.childNodes).filter(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
      );
      const hasElementChildren = el.children.length > 0;
      expect(
        bare.length > 0 && hasElementChildren,
        `${el.tagName}: ${el.textContent}`,
      ).toBe(false);
    }
    expect(within(container).getAllByText("Yang Mulia")).toHaveLength(8);
  });
});

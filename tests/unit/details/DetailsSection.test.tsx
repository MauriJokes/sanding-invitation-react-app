// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EVENT } from "../../../shared/config/event";
import { COUPLE, HOST_GROUPS } from "../../../src/features/details/content";
import { DetailsSection } from "../../../src/features/details/DetailsSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";

const doc = (name: string) => readFileSync(`docs/WEDDING_CONTENT_INFO/${name}`, "utf8");
const lines = (text: string) => text.split(/\r?\n/).map((l) => l.trim());

const renderIt = (lang: "ms" | "en" = "ms") =>
  render(
    <I18nProvider initialLang={lang}>
      <DetailsSection />
    </I18nProvider>,
  );

afterEach(() => {
  cleanup();
  document.documentElement.lang = "";
});

describe("owner-supplied copy", () => {
  it("lists every host as in the supplied Malay and English texts, in the same order", () => {
    for (const file of ["invitation-text-malay.md", "invitation-text-english.md"]) {
      // The source breaks lines inconsistently, so compare on whitespace-normalised text, in order.
      const source = lines(doc(file)).join(" ");
      let from = 0;
      for (const person of HOST_GROUPS.flat()) {
        const full = `${person.name} ${person.lineage}`;
        const at = source.indexOf(full, from);
        expect(at, `${file}: ${full}`).toBeGreaterThanOrEqual(from);
        from = at + full.length;
      }
    }
    expect(HOST_GROUPS.flat()).toHaveLength(8);
  });

  it("has the dress code lines from the supplied dress code file", () => {
    const supplied = lines(doc("dresscode.md")).map((l) => l.replace(/^-\s*/, "")).filter(Boolean);
    renderIt("en");
    for (const line of supplied) expect(screen.getByText(line)).toBeTruthy();
    expect(supplied).toHaveLength(2);
  });

  it("uses the closing lines the owner approved for the single Walimatulurus event", () => {
    renderIt("ms");
    expect(
      screen.getByText(/untuk hadir ke Majlis Walimatulurus anakanda kami:$/),
    ).toBeTruthy();
    cleanup();
    renderIt("en");
    expect(screen.getByText(/to attend the walimatulurus of our beloved children:$/)).toBeTruthy();
  });

  it("keeps Bismillah and the headline once, without the duplicate Assalamu'alaikum line", () => {
    const { container } = renderIt();
    expect(screen.getAllByText("Bismillah")).toHaveLength(1);
    expect(screen.getAllByText("Assalamualaikum WBT & Salam Sejahtera")).toHaveLength(1);
    expect(container.textContent).not.toMatch(/ASSALAMU'ALAIKUM WR\. WB\./i);
  });

  it("presents only the one celebration", () => {
    const { container } = renderIt();
    expect(container.textContent).not.toMatch(/Majlis-Majlis|wedding ceremony|Akad|Bersanding/i);
  });
});

describe("DetailsSection", () => {
  it("is a labelled section with the id the navigation links to", () => {
    renderIt();
    const section = screen.getByRole("region", { name: "Butiran" });
    expect(section.id).toBe("details");
    expect(screen.getByRole("heading", { level: 2, name: "Butiran" })).toBeTruthy();
  });

  it("shows the couple's full names", () => {
    renderIt();
    for (const name of COUPLE) expect(screen.getByText(name)).toBeTruthy();
    expect(COUPLE[0]).toBe("Dk Izyan Naqiyah binti Pengiran Haji Mohd. Jaludin");
    expect(COUPLE[1]).toBe("Nik Adam Danish bin Nik Joharris");
  });

  it("shows date, guest arrival time (no end time) and venue with room as a description list", () => {
    const { container } = renderIt();
    const terms = Array.from(container.querySelectorAll("dt")).map((e) => e.textContent);
    const defs = Array.from(container.querySelectorAll("dd")).map((e) => e.textContent);
    expect(terms).toEqual(["Tarikh", "Ketibaan Tetamu", "Tempat"]);
    expect(defs[0]).toMatch(/Isnin, 28 Disember 2026/i);
    expect(defs[1]).toBe("7.15 malam");
    expect(defs[2]).toBe(`${EVENT.venueName}${EVENT.venueRoom}`);
    expect(container.textContent).not.toMatch(/hingga|sehingga|until|\bto\b \d|end/i);
  });

  it("switches every label and the time to English", () => {
    const { container } = renderIt("en");
    expect(Array.from(container.querySelectorAll("dt")).map((e) => e.textContent)).toEqual(["Date", "Guest Arrival", "Venue"]);
    expect(Array.from(container.querySelectorAll("dd"))[1]?.textContent).toBe("7:15 PM");
    expect(screen.getByRole("heading", { level: 3, name: "Dress Code" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Details" })).toBeTruthy();
  });

  it("has decoration hidden from assistive technology and no links, buttons or images", () => {
    const { container } = renderIt();
    expect(container.querySelectorAll("a, button, img, input").length).toBe(0);
    const swatches = container.querySelectorAll("li > span:first-child");
    expect(swatches).toHaveLength(2);
    for (const s of swatches) expect(s.getAttribute("aria-hidden")).toBe("true");
    const rules = container.querySelectorAll("div[aria-hidden=true]");
    expect(rules.length).toBe(2);
  });

  it("keeps each piece of text in its own element so machine translation cannot break it", () => {
    const { container } = renderIt();
    for (const el of container.querySelectorAll("p, dd, dt, h2, h3, li")) {
      const bare = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      const hasElementChildren = el.children.length > 0;
      expect(bare.length > 0 && hasElementChildren, `${el.tagName}: ${el.textContent}`).toBe(false);
    }
    expect(within(container).getAllByText("Yang Mulia")).toHaveLength(8);
  });
});

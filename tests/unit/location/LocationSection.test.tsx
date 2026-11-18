// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocationSection } from "../../../src/features/location/LocationSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";
import { strings } from "../../../src/i18n/strings";

const renderIt = (lang: "ms" | "en" = "ms") =>
  render(
    <I18nProvider initialLang={lang}>
      <LocationSection />
    </I18nProvider>,
  );

afterEach(() => {
  cleanup();
  document.documentElement.lang = "";
});

// LocationSection now renders the prayer for the couple; directions live in Details.
describe("LocationSection (prayer for the couple)", () => {
  it("is a labelled section with the id the navigation links to", () => {
    renderIt();
    const heading = strings.ms.prayerHeading;
    expect(screen.getByRole("region", { name: heading }).id).toBe("prayer");
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeTruthy();
  });

  it("shows the three prayer paragraphs in order, below the heading", () => {
    const { container } = renderIt();
    const { prayerBlessing, prayerUnion, prayerGuidance } = strings.ms;
    const paragraphs = Array.from(container.querySelectorAll("p")).map((p) => p.textContent);
    expect(paragraphs).toEqual([prayerBlessing, prayerUnion, prayerGuidance]);
    const heading = screen.getByRole("heading", { level: 2 });
    for (const p of container.querySelectorAll("p")) {
      expect(heading.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("opens and closes with the owner's calligraphy, using the prayer words as alt text", () => {
    const { container } = renderIt();
    const images = Array.from(container.querySelectorAll("img"));
    expect(images).toHaveLength(2);
    const opening = screen.getByAltText(strings.ms.prayerOpening);
    const closing = screen.getByAltText(strings.ms.prayerClosing);
    expect(opening.getAttribute("src")).toMatch(/bismillah-trimmed.*\.png$/);
    expect(closing.getAttribute("src")).toMatch(/amin-trimmed.*\.png$/);
    const heading = screen.getByRole("heading", { level: 2 });
    const lastParagraph = container.querySelectorAll("p")[2]!;
    expect(opening.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lastParagraph.compareDocumentPosition(closing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector("[data-asset-placeholder]")).toBeNull();
  });

  it("sizes each image to the screen without shifting the layout, with the Bismillah smaller than the Aamiin", () => {
    renderIt();
    const opening = screen.getByAltText(strings.ms.prayerOpening);
    const closing = screen.getByAltText(strings.ms.prayerClosing);
    for (const img of [opening, closing]) {
      expect(img.getAttribute("width")).toBeTruthy();
      expect(img.getAttribute("height")).toBeTruthy();
      expect(img.className).toMatch(/w-\[clamp\(/);
      expect(img.className).toContain("h-auto");
    }
    const maxRem = (img: Element) => Number(/clamp\([\d.]+rem,[\d.]+vw,([\d.]+)rem\)/.exec(img.className)?.[1]);
    expect(maxRem(opening)).toBeLessThan(maxRem(closing));
  });

  it("does not repeat the venue actions: no map link, copy button, status or embedded map", () => {
    const { container } = renderIt();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("status")).toHaveLength(0);
    expect(container.querySelectorAll("iframe, object, embed, address")).toHaveLength(0);
  });

  it("follows the language", () => {
    renderIt("en");
    expect(screen.getByRole("region", { name: strings.en.prayerHeading }).id).toBe("prayer");
    expect(screen.getByText(strings.en.prayerBlessing)).toBeTruthy();
    expect(screen.getByAltText(strings.en.prayerOpening)).toBeTruthy();
    expect(screen.getByAltText(strings.en.prayerClosing)).toBeTruthy();
    expect(screen.queryByText(strings.ms.prayerBlessing)).toBeNull();
  });

  it("keeps text in its own elements so machine translation cannot break it", () => {
    const { container } = renderIt();
    for (const el of container.querySelectorAll("p, h2")) {
      const bare = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      expect(bare && el.children.length > 0, `${el.tagName}: ${el.textContent}`).toBe(false);
    }
  });
});

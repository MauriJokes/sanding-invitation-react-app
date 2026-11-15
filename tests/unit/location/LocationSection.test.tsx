// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT } from "../../../shared/config/event";
import { LocationSection } from "../../../src/features/location/LocationSection";
import { I18nProvider } from "../../../src/i18n/I18nProvider";

const renderIt = (lang: "ms" | "en" = "ms") =>
  render(
    <I18nProvider initialLang={lang}>
      <LocationSection />
    </I18nProvider>,
  );
const setClipboard = (value: unknown) => Object.defineProperty(navigator, "clipboard", { configurable: true, value });
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

describe("LocationSection", () => {
  it("is a labelled section with the id the navigation links to", () => {
    renderIt();
    expect(screen.getByRole("region", { name: "Lokasi" }).id).toBe("location");
    expect(screen.getByRole("heading", { level: 2, name: "Lokasi" })).toBeTruthy();
  });

  it("shows the venue, room and the full address as plain text (the map is never the only source)", () => {
    const { container } = renderIt();
    expect(screen.getByText(EVENT.venueName)).toBeTruthy();
    expect(screen.getByText(EVENT.venueRoom)).toBeTruthy();
    expect(container.querySelector("address")?.textContent).toBe(EVENT.venueAddress);
    expect(EVENT.venueAddress).toBe("Abdul Razak Complex, Jln Gadong, Bandar Seri Begawan BE3519, Brunei Darussalam");
  });

  it("offers a directions link that opens the owner's map URL in a new tab, safely", () => {
    renderIt();
    const link = screen.getByRole("link", { name: /Buka di Peta/ });
    expect(link.getAttribute("href")).toBe("https://share.google/1Q23UIJpJpyXhl9l9");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toContain("(dibuka di tab baharu)");
  });

  it("has no embedded map, frame or image", () => {
    const { container } = renderIt();
    expect(container.querySelectorAll("iframe, img, object, embed")).toHaveLength(0);
  });

  it("copies the venue and address and announces it politely", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderIt();
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await press(screen.getByRole("button", { name: "Salin alamat" }));
    expect(writeText).toHaveBeenCalledExactlyOnceWith(`${EVENT.venueName}, ${EVENT.venueAddress}`);
    expect(status.textContent).toBe("Alamat disalin.");
    act(() => void vi.advanceTimersByTime(2500));
    expect(status.textContent).toBe("");
  });

  it("tells the guest to copy by hand when the clipboard is unavailable, and keeps the address selectable", async () => {
    setClipboard(undefined);
    const { container } = renderIt();
    await press(screen.getByRole("button", { name: "Salin alamat" }));
    expect(screen.getByRole("status").textContent).toBe("Alamat tidak dapat disalin. Sila salin secara manual.");
    expect(container.querySelector("address")?.textContent).toBe(EVENT.venueAddress);
  });

  it("follows the language, including the messages", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    renderIt("en");
    expect(screen.getByRole("heading", { level: 2, name: "Location" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open in Maps/ }).textContent).toContain("(opens in a new tab)");
    await press(screen.getByRole("button", { name: "Copy address" }));
    expect(screen.getByRole("status").textContent).toBe("Address copied.");
  });

  it("keeps text in its own elements so machine translation cannot break it, and the status always exists", () => {
    const { container } = renderIt();
    for (const el of container.querySelectorAll("p, address, h2, a, button")) {
      const bare = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      expect(bare && el.children.length > 0, `${el.tagName}: ${el.textContent}`).toBe(false);
    }
    expect(container.querySelector("[role=status]")).not.toBeNull();
  });
});

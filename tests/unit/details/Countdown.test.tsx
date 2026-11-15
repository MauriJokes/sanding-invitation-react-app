// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Countdown } from "../../../src/features/details/Countdown";
import { I18nProvider } from "../../../src/i18n/I18nProvider";

const target = Date.parse("2026-12-28T19:15:00+08:00");
const renderIt = (lang: "ms" | "en" = "ms") =>
  render(
    <I18nProvider initialLang={lang}>
      <Countdown />
    </I18nProvider>,
  );
const values = () => within(screen.getByRole("timer")).getAllByText(/^\d+$/).map((e) => e.textContent);

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.documentElement.lang = "";
});

describe("Countdown", () => {
  it("shows days, hours, minutes and seconds with their labels", () => {
    vi.setSystemTime(target - (12 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    renderIt();
    expect(values()).toEqual(["12", "03", "04", "05"]);
    const timer = screen.getByRole("timer");
    for (const label of ["Hari", "Jam", "Minit", "Saat"]) expect(within(timer).getByText(label)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Menanti Hari" })).toBeTruthy();
  });

  it("ticks every second", () => {
    vi.setSystemTime(target - 10_000);
    renderIt();
    expect(values()[3]).toBe("10");
    act(() => void vi.advanceTimersByTime(1000));
    expect(values()[3]).toBe("09");
    act(() => void vi.advanceTimersByTime(3000));
    expect(values()[3]).toBe("06");
  });

  it("is a timer that is not announced every second, and its name gives the target date and time", () => {
    vi.setSystemTime(target - 86400_000);
    renderIt();
    const timer = screen.getByRole("timer");
    expect(timer.getAttribute("aria-live")).toBe("off");
    expect(timer.getAttribute("aria-label")).toBe("Kiraan detik ke Isnin, 28 Disember 2026, 7.15 malam");
  });

  it("follows the language", () => {
    vi.setSystemTime(target - 86400_000);
    renderIt("en");
    expect(screen.getByRole("heading", { name: "Counting Down" })).toBeTruthy();
    expect(screen.getByRole("timer").getAttribute("aria-label")).toBe("Countdown to Monday, 28 December 2026, 7:15 PM");
    expect(within(screen.getByRole("timer")).getByText("Days")).toBeTruthy();
  });

  it("replaces the numbers with a message at the start time, on the day", () => {
    vi.setSystemTime(target - 2000);
    renderIt();
    expect(screen.getByRole("timer")).toBeTruthy();
    act(() => void vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByText("Hari ini hari bahagia kami.")).toBeTruthy();
  });

  it("says thank you from the day after, in either language", () => {
    vi.setSystemTime(Date.parse("2026-12-29T09:00:00+08:00"));
    renderIt();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByText("Terima kasih kerana meraikan hari bahagia kami.")).toBeTruthy();
    cleanup();
    renderIt("en");
    expect(screen.getByText("Thank you for celebrating our special day with us.")).toBeTruthy();
  });

  it("keeps a heading for the section in every state", () => {
    for (const now of [target - 1000, target, target + 3 * 86400_000]) {
      vi.setSystemTime(now);
      const { unmount } = renderIt();
      expect(screen.getByRole("heading", { level: 2, name: "Menanti Hari" })).toBeTruthy();
      unmount();
    }
  });

  it("stops its timer when it unmounts", () => {
    vi.setSystemTime(target - 5000);
    const { unmount } = renderIt();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

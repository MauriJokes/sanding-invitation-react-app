// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";
import { I18nProvider } from "../../src/i18n/I18nProvider";
import { configReply, mockFetch } from "./rsvp/helpers";

const renderApp = (invite?: string) =>
  render(
    <I18nProvider>
      <App invite={invite} />
    </I18nProvider>,
  );

beforeEach(() => {
  mockFetch(() => configReply(2));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.lang = "";
});

describe("App shell", () => {
  it("renders the couple, event title, venue and date in the venue timezone", async () => {
    renderApp();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Izyan & Adam");
    expect(screen.getAllByText("Walimatulurus").length).toBeGreaterThan(0);
    expect(screen.getByText("The Rizqun International Hotel")).toBeTruthy();
    expect(screen.getByText(/Isnin, 28 Disember 2026/i)).toBeTruthy();
    await screen.findByLabelText("Nama keluarga / kumpulan");
  });

  it("provides one main landmark, a skip link that targets it, and the RSVP section inside it", async () => {
    renderApp();
    const main = screen.getByRole("main");
    const skip = screen.getByRole("link", { name: "Langkau ke kandungan" });
    expect(skip.getAttribute("href")).toBe(`#${main.id}`);
    await screen.findByLabelText("Nama keluarga / kumpulan");
    const rsvp = screen.getByRole("region", { name: "RSVP" });
    expect(main.contains(rsvp)).toBe(true);
    expect(rsvp.id).toBe("rsvp");
  });

  it("starts in Malay and switches the whole page to English and back", async () => {
    renderApp();
    await screen.findByLabelText("Nama keluarga / kumpulan");
    expect(document.documentElement.lang).toBe("ms");

    const toEnglish = screen.getByRole("button", { name: "Switch language to English" });
    expect(toEnglish.getAttribute("lang")).toBe("en");
    fireEvent.click(toEnglish);
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("link", { name: "Skip to content" })).toBeTruthy();
    expect(screen.getByText(/Monday, 28 December 2026/i)).toBeTruthy();
    expect(screen.getByLabelText("Family / group name")).toBeTruthy();

    const toMalay = screen.getByRole("button", { name: "Tukar bahasa ke Bahasa Melayu" });
    expect(toMalay.getAttribute("lang")).toBe("ms");
    fireEvent.click(toMalay);
    expect(document.documentElement.lang).toBe("ms");
  });

  it("keeps what the guest typed when the language changes", async () => {
    renderApp();
    const input = await screen.findByLabelText<HTMLInputElement>("Nama keluarga / kumpulan");
    fireEvent.change(input, { target: { value: "The Ahmad Family" } });
    fireEvent.click(screen.getByRole("button", { name: "Switch language to English" }));
    expect(screen.getByLabelText<HTMLInputElement>("Family / group name").value).toBe("The Ahmad Family");
  });
});

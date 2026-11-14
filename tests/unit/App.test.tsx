// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";

afterEach(cleanup);

describe("App shell", () => {
  it("renders the couple, event title, venue and date in the venue timezone", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Izyan & Adam");
    expect(screen.getByText("Walimatulurus")).toBeTruthy();
    expect(screen.getByText("The Rizqun International Hotel")).toBeTruthy();
    expect(screen.getByText(/Isnin, 28 Disember 2026/i)).toBeTruthy();
  });

  it("provides a main landmark and a skip link that targets it", () => {
    render(<App />);
    const main = screen.getByRole("main");
    const skip = screen.getByRole("link", { name: "Langkau ke kandungan" });
    expect(skip.getAttribute("href")).toBe(`#${main.id}`);
  });
});

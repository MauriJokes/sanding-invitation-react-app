// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CrashNotice } from "../../src/components/CrashNotice";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { I18nProvider } from "../../src/i18n/I18nProvider";

function Boom(): never {
  throw new Error("render failed");
}

beforeEach(() => {
  // React logs caught render errors; they are expected here.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(cleanup);

describe("ErrorBoundary", () => {
  it("renders its children normally", () => {
    render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeTruthy();
    expect(screen.queryByText("fallback")).toBeNull();
  });

  it("shows the fallback instead of an empty page when a child throws", () => {
    const { container } = render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("fallback")).toBeTruthy();
    expect(container.children.length).toBeGreaterThan(0);
  });
});

describe("CrashNotice", () => {
  it("explains what happened in Malay and offers a reload", () => {
    const onReload = vi.fn();
    render(
      <I18nProvider>
        <CrashNotice onReload={onReload} />
      </I18nProvider>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Maaf, sesuatu tidak kena.");
    fireEvent.click(screen.getByRole("button", { name: "Muat semula" }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("is available in English", () => {
    render(
      <I18nProvider initialLang="en">
        <CrashNotice onReload={() => undefined} />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(screen.getByText("This page could not be shown. Please reload the page.")).toBeTruthy();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigError } from "../../../server/config/env";
import { SheetsError } from "../../../server/sheets/client";
import { writeThrough } from "../../../server/sheets/write-through";

afterEach(() => vi.restoreAllMocks());
const quiet = () => vi.spyOn(console, "error").mockImplementation(() => undefined);

describe("writeThrough", () => {
  it("marks synced only after the append succeeded, in that order", async () => {
    const order: string[] = [];
    const result = await writeThrough(
      () => Promise.resolve(void order.push("append")),
      () => Promise.resolve(void order.push("mark")),
    );
    expect(result).toBe("synced");
    expect(order).toEqual(["append", "mark"]);
  });

  it("leaves it pending, skips the mark and does not throw when the append fails", async () => {
    const log = quiet();
    const mark = vi.fn();
    const result = await writeThrough(() => Promise.reject(new SheetsError("http", 503)), mark);
    expect(result).toBe("pending");
    expect(mark).not.toHaveBeenCalled();
    expect(log.mock.calls.flat().join(" ")).toContain('"detail":"SheetsError:503"');
  });

  it("stays pending without throwing when marking fails (the row is already in the sheet)", async () => {
    const log = quiet();
    const result = await writeThrough(() => Promise.resolve(), () => Promise.reject(new Error("mongo down")));
    expect(result).toBe("pending");
    expect(log.mock.calls.flat().join(" ")).toContain('"stage":"mark"');
  });

  it("logs only variable names for a missing configuration, never values", async () => {
    const log = quiet();
    await writeThrough(() => Promise.reject(new ConfigError(["GOOGLE_SHEETS_SPREADSHEET_ID"])), vi.fn());
    expect(log.mock.calls.flat().join(" ")).toContain("config:GOOGLE_SHEETS_SPREADSHEET_ID");
  });

  it("never logs an error message, so a row, a name or a URL cannot leak into the logs", async () => {
    const log = quiet();
    await writeThrough(() => Promise.reject(new Error("failed for Keluarga Lim at https://sheets.example/secret")), vi.fn());
    const text = log.mock.calls.flat().join(" ");
    expect(text).not.toMatch(/Keluarga|https|secret/);
    expect(text).toContain('"detail":"Error"');
  });

  it("copes with a non-Error rejection", async () => {
    quiet();
    await expect(writeThrough(() => Promise.reject(new Error("boom")), vi.fn())).resolves.toBe("pending");
  });
});

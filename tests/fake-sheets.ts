import type { HeaderStatus, SheetsApi } from "../server/sheets/client";
import type { SheetValue, WorksheetSpec } from "../server/sheets/rows";

/** In-memory stand-in for Google Sheets. Shared by tests through the setup file's module mock. */
export class FakeSheets implements SheetsApi {
  readonly sheets = new Map<string, SheetValue[][]>();
  appendCalls = 0;
  /** While set, every call fails the way an outage would. */
  failWith: Error | undefined;

  reset(): void {
    this.sheets.clear();
    this.appendCalls = 0;
    this.failWith = undefined;
  }

  rows(name: string): SheetValue[][] {
    return this.sheets.get(name) ?? [];
  }

  /** Simulates a row that reached the sheet while the response was lost. */
  seed(name: string, row: SheetValue[]): void {
    this.sheets.set(name, [...this.rows(name), row]);
  }

  appendRows(sheet: WorksheetSpec, rows: SheetValue[][]): Promise<void> {
    if (this.failWith) return Promise.reject(this.failWith);
    this.appendCalls++;
    this.sheets.set(sheet.name, [...this.rows(sheet.name), ...rows]);
    return Promise.resolve();
  }

  listIds(sheet: WorksheetSpec): Promise<Set<string>> {
    if (this.failWith) return Promise.reject(this.failWith);
    return Promise.resolve(new Set(this.rows(sheet.name).map((row) => String(row[0]))));
  }

  ensureWorksheet(sheet: WorksheetSpec): Promise<{ created: boolean; headers: HeaderStatus }> {
    if (this.failWith) return Promise.reject(this.failWith);
    const created = !this.sheets.has(sheet.name);
    if (created) this.sheets.set(sheet.name, [[...sheet.headers]]);
    return Promise.resolve({ created, headers: created ? "written" : "ok" });
  }
}

export const fakeSheets = new FakeSheets();

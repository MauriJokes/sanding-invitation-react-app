import { JWT } from "google-auth-library";
import { getSheetsEnv } from "../config/env.js";
import type { SheetValue, WorksheetSpec } from "./rows.js";

export const SHEETS_TIMEOUT_MS = 5000;
const SHEETS_BASE_URL = "https://sheets.googleapis.com";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/** Carries only an HTTP status or a short reason. Response bodies can echo request data, so they are never kept. */
export class SheetsError extends Error {
  readonly status: number | undefined;
  constructor(reason: string, status?: number) {
    super(reason);
    this.name = "SheetsError";
    this.status = status;
  }
}

export type HeaderStatus = "written" | "ok" | "mismatch";

export interface SheetsApi {
  /** One atomic request; rows go after the last row of the table (INSERT_ROWS) and are stored RAW. */
  appendRows(sheet: WorksheetSpec, rows: SheetValue[][]): Promise<void>;
  /** Values in column A (first column holds the stable id). */
  listIds(sheet: WorksheetSpec): Promise<Set<string>>;
  /** Creates the tab and writes the header row only when missing; never overwrites existing content. */
  ensureWorksheet(sheet: WorksheetSpec): Promise<{ created: boolean; headers: HeaderStatus }>;
}

export interface SheetsApiOptions {
  spreadsheetId: string;
  getAccessToken: () => Promise<string>;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const columnLetter = (count: number) => String.fromCharCode(64 + count);
const quote = (name: string) => `'${name.replaceAll("'", "''")}'`;

export function createSheetsApi(options: SheetsApiOptions): SheetsApi {
  const base = `${options.baseUrl ?? SHEETS_BASE_URL}/v4/spreadsheets/${encodeURIComponent(options.spreadsheetId)}`;
  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? SHEETS_TIMEOUT_MS;

  /** One deadline for the whole operation, including getting the access token. */
  async function call(method: string, path: string, body?: unknown): Promise<unknown> {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const token = await abortable(options.getAccessToken(), signal);
      const response = await doFetch(`${base}${path}`, {
        method,
        signal,
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new SheetsError("http", response.status);
      const data: unknown = await response.json();
      return data;
    } catch (error) {
      if (error instanceof SheetsError) throw error;
      throw new SheetsError(signal.aborted ? "timeout" : "network");
    }
  }

  const range = (sheet: WorksheetSpec, a1: string) => encodeURIComponent(`${quote(sheet.name)}!${a1}`);
  const lastColumn = (sheet: WorksheetSpec) => columnLetter(sheet.headers.length);

  return {
    async appendRows(sheet, rows) {
      if (rows.length === 0) return;
      await call(
        "POST",
        `/values/${range(sheet, `A:${lastColumn(sheet)}`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { values: rows },
      );
    },

    async listIds(sheet) {
      const data = (await call("GET", `/values/${range(sheet, "A:A")}?majorDimension=COLUMNS`)) as { values?: unknown };
      const column = Array.isArray(data.values) && Array.isArray(data.values[0]) ? (data.values[0] as unknown[]) : [];
      return new Set(column.filter((value): value is string => typeof value === "string"));
    },

    async ensureWorksheet(sheet) {
      const meta = (await call("GET", "?fields=sheets.properties.title")) as {
        sheets?: { properties?: { title?: string } }[];
      };
      const exists = (meta.sheets ?? []).some((entry) => entry.properties?.title === sheet.name);
      if (!exists) {
        await call("POST", ":batchUpdate", { requests: [{ addSheet: { properties: { title: sheet.name } } }] });
      }

      const firstRow = range(sheet, `A1:${lastColumn(sheet)}1`);
      const current = (await call("GET", `/values/${firstRow}`)) as { values?: unknown };
      const row = Array.isArray(current.values) && Array.isArray(current.values[0]) ? (current.values[0] as unknown[]) : [];
      if (row.length === 0) {
        await call("PUT", `/values/${firstRow}?valueInputOption=RAW`, { values: [sheet.headers] });
        return { created: !exists, headers: "written" };
      }
      const same = sheet.headers.every((header, index) => row[index] === header);
      return { created: !exists, headers: same ? "ok" : "mismatch" };
    },
  };
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) return reject(new SheetsError("timeout"));
    signal.addEventListener("abort", () => reject(new SheetsError("timeout")), { once: true });
    promise.then(resolve, reject);
  });
}

let cached: { key: string; api: SheetsApi } | undefined;

/** One authenticated client per warm instance (the library caches the access token). Throws ConfigError when not configured. */
export function getSheetsApi(): SheetsApi {
  const env = getSheetsEnv();
  const key = `${env.GOOGLE_SERVICE_ACCOUNT_EMAIL}|${env.GOOGLE_SHEETS_SPREADSHEET_ID}`;
  if (cached?.key === key) return cached.api;

  const auth = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: [SHEETS_SCOPE],
  });
  const api = createSheetsApi({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    getAccessToken: async () => {
      const { token } = await auth.getAccessToken();
      if (!token) throw new SheetsError("no-token");
      return token;
    },
  });
  cached = { key, api };
  return api;
}

export function getWorksheetNames(): { rsvp: string; guestbook: string } {
  const env = getSheetsEnv();
  return { rsvp: env.GOOGLE_SHEETS_RSVP_WORKSHEET_NAME, guestbook: env.GOOGLE_SHEETS_GUESTBOOK_WORKSHEET_NAME };
}

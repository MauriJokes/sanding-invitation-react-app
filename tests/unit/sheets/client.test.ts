import { describe, expect, it, vi } from "vitest";
import { ConfigError } from "../../../server/config/env";
import { SheetsError, createSheetsApi } from "../../../server/sheets/client";
import { GUESTBOOK_HEADERS, RSVP_HEADERS, type WorksheetSpec } from "../../../server/sheets/rows";

const RSVP: WorksheetSpec = { name: "Family RSVP", headers: RSVP_HEADERS };
const GUESTBOOK: WorksheetSpec = { name: "Guestbook", headers: GUESTBOOK_HEADERS };

interface Recorded {
  method: string;
  url: URL;
  headers: Headers;
  body: unknown;
}

/** A fake Google: answers by method+path and records what was sent. */
function fakeGoogle(answer: (call: Recorded) => { status?: number; json?: unknown } | Error = () => ({ json: {} })) {
  const calls: Recorded[] = [];
  const fetchImpl = vi.fn((input: string | URL, init?: RequestInit) => {
    const call: Recorded = {
      method: init?.method ?? "GET",
      url: new URL(input),
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined,
    };
    calls.push(call);
    const reply = answer(call);
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve(new Response(JSON.stringify(reply.json ?? {}), { status: reply.status ?? 200 }));
  });
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

const make = (google: ReturnType<typeof fakeGoogle>, extra: Partial<Parameters<typeof createSheetsApi>[0]> = {}) =>
  createSheetsApi({
    spreadsheetId: "sheet-123",
    getAccessToken: () => Promise.resolve("token-abc"),
    baseUrl: "https://sheets.test",
    fetchImpl: google.fetchImpl,
    ...extra,
  });

describe("appendRows", () => {
  it("posts one atomic RAW / INSERT_ROWS append to the tab's columns with a bearer token", async () => {
    const google = fakeGoogle();
    await make(google).appendRows(RSVP, [["id1", "t", "The Lim Family", "external", "attending", 2]]);

    expect(google.calls).toHaveLength(1);
    const call = google.calls[0] as Recorded;
    expect(call.method).toBe("POST");
    expect(call.url.origin + call.url.pathname).toBe("https://sheets.test/v4/spreadsheets/sheet-123/values/'Family RSVP'!A:G:append".replace("'Family RSVP'!A:G", encodeURIComponent("'Family RSVP'!A:G")));
    expect(call.url.searchParams.get("valueInputOption")).toBe("RAW");
    expect(call.url.searchParams.get("insertDataOption")).toBe("INSERT_ROWS");
    expect(call.headers.get("authorization")).toBe("Bearer token-abc");
    expect(call.headers.get("content-type")).toBe("application/json");
    expect(call.body).toEqual({ values: [["id1", "t", "The Lim Family", "external", "attending", 2]] });
  });

  it("uses the right last column for each tab", async () => {
    const google = fakeGoogle();
    await make(google).appendRows(GUESTBOOK, [["g", "t", "n", "public", "m"]]);
    expect(decodeURIComponent(google.calls[0]?.url.pathname ?? "")).toContain("'Guestbook'!A:E:append");
  });

  it("sends many rows in a single request", async () => {
    const google = fakeGoogle();
    await make(google).appendRows(GUESTBOOK, [["1"], ["2"], ["3"]]);
    expect(google.calls).toHaveLength(1);
    expect((google.calls[0]?.body as { values: unknown[] }).values).toHaveLength(3);
  });

  it("sends nothing for an empty batch", async () => {
    const google = fakeGoogle();
    await make(google).appendRows(RSVP, []);
    expect(google.calls).toHaveLength(0);
  });

  it("quotes a tab name that contains an apostrophe", async () => {
    const google = fakeGoogle();
    await make(google).appendRows({ name: "Adam's RSVP", headers: RSVP_HEADERS }, [["x"]]);
    expect(decodeURIComponent(google.calls[0]?.url.pathname ?? "")).toContain("'Adam''s RSVP'!A:G:append");
  });

  it("sends formula-like and markup text unchanged in the body", async () => {
    const google = fakeGoogle();
    await make(google).appendRows(GUESTBOOK, [["g", "t", "=1+1", "public", "<script>x</script>\n=SUM(A1)"]]);
    expect((google.calls[0]?.body as { values: string[][] }).values[0]).toEqual(["g", "t", "=1+1", "public", "<script>x</script>\n=SUM(A1)"]);
  });
});

describe("listIds", () => {
  it("returns the first column as a set", async () => {
    const google = fakeGoogle(() => ({ json: { values: [["RSVP ID", "a", "b", "a"]] } }));
    expect(await make(google).listIds(RSVP)).toEqual(new Set(["RSVP ID", "a", "b"]));
    const call = google.calls[0] as Recorded;
    expect(call.method).toBe("GET");
    expect(decodeURIComponent(call.url.pathname)).toContain("'Family RSVP'!A:A");
    expect(call.url.searchParams.get("majorDimension")).toBe("COLUMNS");
  });

  it("returns an empty set for an empty sheet, which Google answers without a values field", async () => {
    expect(await make(fakeGoogle(() => ({ json: {} }))).listIds(RSVP)).toEqual(new Set());
  });

  it("ignores non-string cells", async () => {
    expect(await make(fakeGoogle(() => ({ json: { values: [["a", 5, null, "b"]] } }))).listIds(RSVP)).toEqual(new Set(["a", "b"]));
  });
});

describe("ensureWorksheet", () => {
  function sheetState(opts: { tabs: string[]; firstRow?: unknown[] }) {
    return fakeGoogle((call) => {
      if (call.method === "GET" && call.url.searchParams.get("fields")) {
        return { json: { sheets: opts.tabs.map((title) => ({ properties: { title } })) } };
      }
      if (call.method === "GET") return { json: opts.firstRow ? { values: [opts.firstRow] } : {} };
      return { json: {} };
    });
  }

  it("creates a missing tab and writes the header row", async () => {
    const google = sheetState({ tabs: ["Sheet1"] });
    expect(await make(google).ensureWorksheet(RSVP)).toEqual({ created: true, headers: "written" });
    const add = google.calls.find((c) => c.url.pathname.endsWith(":batchUpdate"));
    expect(add?.body).toEqual({ requests: [{ addSheet: { properties: { title: "Family RSVP" } } }] });
    const put = google.calls.find((c) => c.method === "PUT");
    expect(put?.url.searchParams.get("valueInputOption")).toBe("RAW");
    expect(put?.body).toEqual({ values: [[...RSVP_HEADERS]] });
  });

  it("writes headers into an existing empty tab without creating it", async () => {
    const google = sheetState({ tabs: ["Family RSVP"] });
    expect(await make(google).ensureWorksheet(RSVP)).toEqual({ created: false, headers: "written" });
    expect(google.calls.some((c) => c.url.pathname.endsWith(":batchUpdate"))).toBe(false);
  });

  it("changes nothing when the headers are already right", async () => {
    const google = sheetState({ tabs: ["Family RSVP"], firstRow: [...RSVP_HEADERS] });
    expect(await make(google).ensureWorksheet(RSVP)).toEqual({ created: false, headers: "ok" });
    expect(google.calls.every((c) => c.method === "GET")).toBe(true);
  });

  it("reports a different header row and never overwrites it", async () => {
    const google = sheetState({ tabs: ["Family RSVP"], firstRow: ["My", "own", "columns"] });
    expect(await make(google).ensureWorksheet(RSVP)).toEqual({ created: false, headers: "mismatch" });
    expect(google.calls.every((c) => c.method === "GET")).toBe(true);
  });
});

describe("failures", () => {
  it.each([401, 403, 404, 429, 500, 503])("turns an HTTP %i into a SheetsError carrying only the status", async (status) => {
    const google = fakeGoogle(() => ({ status, json: { error: { message: "The caller does not have permission for Keluarga Lim row" } } }));
    const error = await make(google).appendRows(RSVP, [["x"]]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SheetsError);
    expect((error as SheetsError).status).toBe(status);
    expect(String((error as SheetsError).message)).not.toMatch(/Keluarga|permission/);
  });

  it("reports a network failure as 'network' without the underlying message", async () => {
    const google = fakeGoogle(() => new TypeError("fetch failed: connect ECONNREFUSED sheets.googleapis.com"));
    const error = await make(google).appendRows(RSVP, [["x"]]).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: "SheetsError", message: "network" });
  });

  it("times out a request that never answers, and aborts it", async () => {
    let aborted = false;
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            aborted = true;
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    ) as unknown as typeof fetch;
    const started = Date.now();
    const error = await make({ calls: [], fetchImpl }, { timeoutMs: 60 }).appendRows(RSVP, [["x"]]).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: "SheetsError", message: "timeout" });
    expect(aborted).toBe(true);
    expect(Date.now() - started).toBeLessThan(1500);
  });

  it("times out when getting the access token hangs, before any request is made", async () => {
    const google = fakeGoogle();
    const api = make(google, { getAccessToken: () => new Promise<string>(() => undefined), timeoutMs: 60 });
    expect(await api.appendRows(RSVP, [["x"]]).catch((e: unknown) => e)).toMatchObject({ message: "timeout" });
    expect(google.calls).toHaveLength(0);
  });

  it("fails cleanly when the token request itself fails", async () => {
    const google = fakeGoogle();
    const api = make(google, { getAccessToken: () => Promise.reject(new Error("invalid_grant: bad key")) });
    const error = await api.appendRows(RSVP, [["x"]]).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: "SheetsError" });
    expect(String((error as Error).message)).not.toMatch(/invalid_grant|key/);
  });

  it("treats a non-JSON success body as a failure, not a success", async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response("<html>oops</html>", { status: 200 }))) as unknown as typeof fetch;
    expect(await make({ calls: [], fetchImpl }).appendRows(RSVP, [["x"]]).catch((e: unknown) => e)).toBeInstanceOf(SheetsError);
  });
});

describe("getSheetsApi (the real factory)", () => {
  async function actual() {
    const mod = await vi.importActual<typeof import("../../../server/sheets/client")>("../../../server/sheets/client");
    return mod;
  }

  it("throws a ConfigError naming only the missing variables when Google is not configured", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "");
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "");
    const { getSheetsApi } = await actual();
    try {
      getSheetsApi();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).variables.sort()).toEqual([
        "GOOGLE_SERVICE_ACCOUNT_EMAIL",
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
        "GOOGLE_SHEETS_SPREADSHEET_ID",
      ]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("builds a client once per instance without making any network call, and reads the tab names with their defaults", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "svc@project.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "not-a-real-key\\nline2");
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "sheet-123");
    vi.stubEnv("GOOGLE_SHEETS_RSVP_WORKSHEET_NAME", "");
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    const { getSheetsApi, getWorksheetNames } = await actual();
    const first = getSheetsApi();
    expect(getSheetsApi()).toBe(first);
    expect(Object.keys(first).sort()).toEqual(["appendRows", "ensureWorksheet", "listIds"]);
    expect(getWorksheetNames()).toEqual({ rsvp: "Family RSVP", guestbook: "Guestbook" });
    expect(network).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

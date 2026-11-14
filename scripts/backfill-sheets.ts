import { closeDb, getDb } from "../server/db/client.js";
import { backfill, checkPending } from "../server/sheets/backfill.js";
import { getSheetsApi, getWorksheetNames } from "../server/sheets/client.js";
import { GUESTBOOK_HEADERS, RSVP_HEADERS } from "../server/sheets/rows.js";

/**
 * npm run sheets:backfill -- [--check | --setup]
 *   (no flag)  create missing tabs/headers, then append every pending row (skips ids already in the sheet)
 *   --check    read-only: how many rows are pending in MongoDB (touches nothing, needs no Google access)
 *   --setup    only create missing tabs and header rows; verifies the Google credentials without touching data
 * Prints counts and tab names only, never names, messages or secrets.
 */
async function main() {
  const flag = process.argv[2];
  if (flag !== undefined && flag !== "--check" && flag !== "--setup") {
    throw new Error("Unknown option. Use --check, --setup, or no option.");
  }

  const db = await getDb();

  if (flag === "--check") {
    const reports = await checkPending(db, { rsvp: "", guestbook: "" });
    for (const report of reports) {
      console.log(`${report.label}: ${report.pending} pending${report.oldest ? `, oldest ${report.oldest.toISOString()}` : ""}`);
    }
    return;
  }

  const names = getWorksheetNames();
  const api = getSheetsApi();
  for (const sheet of [
    { name: names.rsvp, headers: RSVP_HEADERS },
    { name: names.guestbook, headers: GUESTBOOK_HEADERS },
  ]) {
    const result = await api.ensureWorksheet(sheet);
    console.log(
      `worksheet "${sheet.name}": ${result.created ? "created" : "exists"}, header row ${result.headers}` +
        (result.headers === "mismatch" ? " (existing header differs from the expected one; left untouched, fix it by hand)" : ""),
    );
  }
  if (flag === "--setup") return;

  let failed = false;
  for (const report of await backfill(db, api, names)) {
    failed ||= report.failed;
    console.log(
      `${report.label}: ${report.appended} appended, ${report.alreadyPresent} already in the sheet, ${report.remaining} still pending${report.failed ? " (FAILED, run again)" : ""}`,
    );
  }
  if (failed) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(`Backfill failed: ${error instanceof Error ? error.name : "unknown error"}${error instanceof Error && error.message ? ` (${error.message})` : ""}`);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

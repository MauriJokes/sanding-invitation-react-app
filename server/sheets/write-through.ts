import { ConfigError } from "../config/env.js";
import { SheetsError } from "./client.js";

/** Class and status only: never a message, a row, a name or a URL. */
function describe(error: unknown): string {
  if (error instanceof ConfigError) return `config:${error.variables.join(",")}`;
  if (error instanceof SheetsError) return `${error.name}:${error.status ?? error.message}`;
  return error instanceof Error ? error.name : "unknown";
}

/**
 * Runs after the MongoDB insert has succeeded. It never throws: a Sheets problem must not change the guest's
 * response. The document stays `pending` and `npm run sheets:backfill` recovers it.
 */
export async function writeThrough(append: () => Promise<void>, markSynced: () => Promise<void>): Promise<"synced" | "pending"> {
  try {
    await append();
  } catch (error) {
    console.error(JSON.stringify({ event: "sheets_error", stage: "append", detail: describe(error) }));
    return "pending";
  }
  try {
    await markSynced();
  } catch (error) {
    // The row is in the sheet but still marked pending; the backfill skips ids already present.
    console.error(JSON.stringify({ event: "sheets_error", stage: "mark", detail: describe(error) }));
    return "pending";
  }
  return "synced";
}

# Google Sheets Mirror Specification

## 1. Purpose

Give the couple a familiar spreadsheet view of family/group RSVPs and guestbook messages without making Google Sheets the authoritative database.

## 2. Authority

MongoDB Atlas is authoritative. Google Sheets is a one-way mirror. Spreadsheet edits never change MongoDB records. Sorting, filtering or deleting rows in the sheet is safe.

## 3. Model: write-through with a pending flag

There is no scheduled sync, sync-state collection or internal sync endpoint (Vercel Hobby cron is limited to once per day).

1. Validate the request and insert into MongoDB with `sheetStatus: "pending"`.
2. Await a Sheets `append` for the new row with a short timeout (about 5 s). Do not fire-and-forget; Hobby functions can be frozen after the response is sent.
3. On success, set `sheetStatus: "synced"` and `sheetSyncedAt`.
4. On failure or timeout, leave `sheetStatus: "pending"`, log a safe error code only, and still return success to the guest.
5. `npm run sheets:backfill` (`scripts/backfill-sheets.ts`, run manually by the owner/developer) appends all pending rows oldest first, skipping IDs already present in the sheet, then marks them synced. `-- --check` prints pending counts from MongoDB without touching Sheets; `-- --setup` only creates missing tabs and header rows (and so verifies the Google credentials) without touching data. Output is counts and tab names only.

## 4. Worksheets

Two application-owned tabs in one spreadsheet. Use a fixed header row and put no other content on these tabs.

**`Family RSVP`**

| Column | Source |
|---|---|
| RSVP ID | MongoDB `_id` |
| Submitted At | `createdAt` (venue timezone, ISO) |
| Family / Group Name | `familyGroupName` |
| Guest Type | `internal` / `external` |
| RSVP Status | `attending` / `declined` |
| Attendee Count | `attendeeCount` |
| Phone Number | `phoneNumber` (E.164) |

**`Guestbook`**

| Column | Source |
|---|---|
| Entry ID | MongoDB `_id` |
| Submitted At | `createdAt` |
| Name | `displayName` (always given for new entries; blank only on entries from before the name became required) |
| Visibility | `public` / `anonymous` (`anonymous` means the guest chose to send privately) |
| Message | `message` |

Never include the invite code, secrets, IP addresses or hashes.

## 5. Write rules

- Use `values.append` with `valueInputOption: RAW` so values beginning with `=`, `+`, `-` or `@` are not interpreted as formulas, and `insertDataOption: INSERT_ROWS`.
- Reuse one authenticated client per warm instance.
- Concurrent appends are atomic; no lock is needed.
- A lost response after a successful append can duplicate a row on retry; the backfill ID check keeps this rare and low impact.

## 6. Credentials

- Dedicated Google service account, with only the target spreadsheet shared with it (Editor).
- Keep credentials in Vercel server-side environment variables; normalise `\n` in the private key.
- Do not commit service-account JSON or send credentials to the browser.

## 7. Failure handling

- RSVP and guestbook persistence succeed independently of Sheets availability.
- Quota (60 writes/min per user) is not a realistic risk. A 429 becomes `pending` and is recovered by the backfill script.
- Pending state lives in MongoDB, not in a public endpoint.

## 8. Configuration

Server-side: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_RSVP_WORKSHEET_NAME`, `GOOGLE_SHEETS_GUESTBOOK_WORKSHEET_NAME`. Validate configuration before the first append and fail safely.

## 9. Setup guide (owner, one time)

1. **Create a Google Cloud project** (console.cloud.google.com) and **enable the Google Sheets API** for it. No billing is needed.
2. **Create a service account** (IAM and Admin, Service Accounts). It needs no project roles.
3. **Create a JSON key** for it (Keys, Add key, JSON). Treat the file like a password: never commit it, never paste it into chat, delete the downloaded copy once the values are stored.
4. **Create the spreadsheet** (a new Google Sheet, owned by you). Copy its ID from the URL (`https://docs.google.com/spreadsheets/d/<ID>/edit`).
5. **Share the spreadsheet with the service account's email** (the `client_email` in the key file) as **Editor**. Share it with nobody else except the couple.
6. **Set the variables** in `.env.local` and in Vercel (Preview and Production): `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email`; `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` = `private_key` (paste the value including the `-----BEGIN/END PRIVATE KEY-----` lines; literal `\n` sequences and real line breaks both work); `GOOGLE_SHEETS_SPREADSHEET_ID` = the ID. The two tab-name variables are optional (blank means `Family RSVP` / `Guestbook`).
7. **Create the tabs and headers:** `npm run sheets:backfill -- --setup`. It prints `created`/`exists` and the header status for each tab, and never overwrites an existing header row (a different one is reported as `mismatch` and left alone). A `Family RSVP` tab created before the phone number was added has six headers: type `Phone Number` in cell G1 by hand (the app appends seven values per row, and rows written before that simply have an empty column G).
8. **Send already-stored rows** (anything submitted before Sheets was configured): `npm run sheets:backfill`.

Keep the two tabs for the app only: no other content in them, and no rows inserted above the header. Sorting or filtering the sheet is safe; the app never reads edits back.

## 10. Known limits

- A row whose append succeeded but whose confirmation was lost is not duplicated by the backfill (it skips ids already present), but a **live** retry cannot be told apart from a new submission only for guestbook wishes: the guestbook has no duplicate guard, so a guest who resubmits after an unanswered attempt can create two wishes (the owner can delete one; see `OPERATIONS.md`).
- The sheet holds guests' names and messages in clear text. If you export it to Excel or CSV, treat cell contents as untrusted (a cell starting with `=`, `+`, `-` or `@` can be run as a formula by Excel even though Google Sheets stores it as text).

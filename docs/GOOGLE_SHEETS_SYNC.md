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
5. `scripts/backfill-sheets.ts` (run manually by the owner/developer) appends all pending rows, skipping IDs already present in the sheet, then marks them synced. It supports a `--check` mode that prints pending counts without writing.

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

**`Guestbook`**

| Column | Source |
|---|---|
| Entry ID | MongoDB `_id` |
| Submitted At | `createdAt` |
| Name | `displayName` (blank if none given) |
| Visibility | `public` / `anonymous` |
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

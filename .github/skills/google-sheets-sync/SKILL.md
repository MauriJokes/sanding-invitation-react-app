---
name: google-sheets-sync
description: >
  Use when implementing or troubleshooting the one-way MongoDB-to-Google-Sheets reporting mirror, service-account access, write-through appends, the pending flag, or the backfill script.
---

# Google Sheets Sync Skill

## Objective
Maintain a reliable, private write-through mirror of MongoDB RSVP and guestbook records.

## Read first
- `docs/GOOGLE_SHEETS_SYNC.md`
- `docs/DATA_MODEL.md`
- `docs/SECURITY_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`

## Authority
MongoDB is the only source of truth. Google Sheets is a one-way mirror. Never implement two-way sync unless the owner explicitly changes scope and approves conflict rules.

## Implementation rules
- Use a dedicated service account.
- Share only the target spreadsheet with the service account.
- Keep credentials in server-side environment variables.
- Never commit service-account JSON.
- Never expose credentials to browser code.
- Never include the invite code, IP data or secrets in the sheet.
- Use stable MongoDB `_id` values as the row key (first column).
- Write with `valueInputOption: RAW` and `insertDataOption: INSERT_ROWS`.
- Await the append with a short timeout after the MongoDB insert; never fire-and-forget.
- Track `sheetStatus` (`pending`/`synced`) and `sheetSyncedAt` on each document.
- Only mark `synced` after the append succeeds.

## Recommended strategy
Two application-owned worksheets (`Family RSVP`, `Guestbook`). Append one row per accepted submission. Do not add a cron, sync-state collection or internal sync route. Recovery is a manual `scripts/backfill-sheets.ts` that appends pending rows and skips IDs already present.

- Use `google-auth-library` for authentication and plain `fetch` for the REST calls; never log a Sheets response body, a row or a URL.
- Tests never reach Google: use `tests/fake-sheets.ts` (installed for every test by `tests/setup-sheets.ts`).

## Failure handling
- A committed RSVP remains committed if Google API is unavailable.
- Leave `sheetStatus: "pending"` after failure and still return success to the guest.
- Recover via the manual backfill script (with a `--check` mode).
- Use a short timeout; no long retry loops in guest-facing paths.
- Do not store secret-bearing error payloads.
- Respect API quotas and Vercel function limits.

## Testing
- Each submission appears once in the correct worksheet.
- Declined and attending values are represented correctly.
- Anonymous guestbook entries are labelled `anonymous` in the sheet.
- Formula-like values (`=`, `+`, `-`, `@`) stay as text.
- API failure leaves `pending` and the HTTP response is still successful.
- Backfill appends pending rows, skips existing IDs and is idempotent.

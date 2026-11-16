# Milestone 4 — Google Sheets and Guestbook

Activate `google-sheets-sync`, `guestbook-interactions`, `vercel-serverless`, `mongodb-data` and `quality-assurance`.

Google Sheets (write-through, no cron):
- After each accepted RSVP and guestbook insert, await an append to `Family RSVP` / `Guestbook` with a short timeout, using server-side service-account credentials and `valueInputOption: RAW`.
- Track `sheetStatus` (`pending`/`synced`) and `sheetSyncedAt`.
- Do not let a Sheets failure invalidate a successful write.
- Add `scripts/backfill-sheets.ts` (with `--check`) that appends pending rows, skips IDs already present and is idempotent.
- Test failure leaving `pending`, backfill, repeated backfill and formula-like input.

Guestbook:
- Name (required from M6, D-38), "Send privately" checkbox, required message, honeypot field.
- Named entries publish immediately; anonymous entries are stored and mirrored but never returned publicly.
- Validate lengths, rate-limit writes (MongoDB TTL, hashed IP), render plain text only.
- Return bounded, cursor-paginated public records, newest first.
- Test unsafe markup, empty values, oversized values, rate limiting and anonymous exclusion.

Do not add a moderation dashboard or an internal sync endpoint.

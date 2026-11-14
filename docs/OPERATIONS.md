# Operations

Short, practical procedures for running the site. The production runbook and smoke test are completed in M7.

## Commands

| Command | What it does |
|---|---|
| `npm run db:indexes` | Creates the MongoDB indexes. Run once per database (dev, preview, production) before it takes RSVPs. Safe to repeat. If it was missed, the RSVP endpoints answer 503 instead of accepting duplicates. |
| `npm run sheets:backfill -- --check` | Read-only: how many RSVPs and wishes are still `pending` (not yet in the Google Sheet). Needs only MongoDB access. |
| `npm run sheets:backfill -- --setup` | Creates the two tabs and their header rows if missing; proves the Google credentials work. Touches no data. |
| `npm run sheets:backfill` | Adds every pending row to the sheet (oldest first, never duplicating a row already there). Safe to repeat. |

All commands read `.env.local` and print counts and tab names only, never names, messages or secrets. To run one against production, put the production values in a temporary shell environment (not in a committed file).

## When rows are `pending`

Each RSVP and wish is saved in MongoDB first and then added to the sheet. If Google is down, slow or not configured, the guest still sees success and the row stays `pending`. Run `npm run sheets:backfill -- --check` to see the count and `npm run sheets:backfill` to catch up. Vercel logs show `sheets_error` lines with a short reason (`config:<variable names>` or an HTTP status), never any guest content.

## Removing an inappropriate guestbook entry

There is no moderation page or public delete (by design). The owner removes an entry directly:

1. In MongoDB Atlas, open the cluster, Browse Collections, database, `guestbookEntries`.
2. Find the entry (filter on `message` or `displayName`) and **delete the document**. It disappears from the public list immediately.
3. In the Google Sheet, delete the matching row in the `Guestbook` tab (match the Entry ID in column A to the document's `_id`). Deleting the sheet row does not change MongoDB, and the backfill will not re-add it once the document is gone.

To hide an entry without deleting it, set its `isPublic` field to `false`; it then behaves like an anonymous wish (kept for the couple, not shown).

To remove a mistaken RSVP, delete its document in `rsvps` and its row in the `Family RSVP` tab; the family can then submit again.

## If a secret is exposed

Rotate it at the source, update it in Vercel (all environments) and `.env.local`, and redeploy: the MongoDB user's password in Atlas; the Google service-account key (create a new key, delete the old one); `INTERNAL_INVITE_CODE` (this invalidates old internal links, so re-share the new one); `RATE_LIMIT_SALT` (harmless to change, it only resets the rate-limit counters).

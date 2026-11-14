---
name: mongodb-data
description: >
  Use when defining MongoDB documents, indexes, repositories, queries, connection handling, data integrity, seed scripts, or migrations for this application.
---

# MongoDB Data Skill

## Objective
Use MongoDB Atlas as the authoritative persistence layer with a small, well-indexed data model.

## Read first
- `docs/DATA_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_REQUIREMENTS.md`
- Relevant feature specification.

## Rules
- Use the official MongoDB Node.js driver unless a concrete approved reason changes this.
- Keep MongoDB client and URI server-side.
- Reuse a cached MongoClient across warm function invocations where appropriate.
- Do not connect/disconnect for every request.
- Do not create indexes on every request.
- Create indexes through an explicit setup script or controlled migration.
- Use typed domain models and validate input before persistence.
- Avoid storing redundant relationship arrays unless justified.
- Store declined RSVP responses explicitly if the form supports a declined status.
- Keep MongoDB authoritative; never treat Sheets as the write source.

## Required integrity
- One RSVP per canonical family/group (the RSVP has no event dimension).
- Generate the canonical family/group key server-side.
- Enforce uniqueness with a database index and handle duplicate-key errors.
- Enforce attendee-count bounds server-side: `attending` is 1 to the maximum for the server-derived `guestType` (internal 10, external 2); `declined` is 0.
- Store the derived `guestType` on each RSVP (never the invite code); it does not affect the unique key.
- Public RSVP writes are insert-only; no update/upsert endpoint.
- Do not create invitation-token or individual-guest collections for this initial flow.
- Collections: `rsvps`, `guestbookEntries`, `rateLimits` (TTL, salted-hash IP keys). No `SyncState`.
- Every RSVP and guestbook document carries `sheetStatus` and optional `sheetSyncedAt`.

## Query discipline
- Query only required fields.
- Add indexes based on real query patterns.
- Bound and paginate public guestbook reads.
- Avoid unbounded collection reads in public request handlers.
- Use insert-only writes for public RSVPs and guestbook entries; the only follow-up write is setting `sheetStatus`/`sheetSyncedAt`.
- Public guestbook reads must filter `isPublic: true` and project only `displayName`, `message`, `createdAt`.
- Consider transaction support only where multi-document atomicity is genuinely required and supported by the Atlas deployment.

## Data changes
- Review impact on existing data before changing schemas.
- Provide a migration or controlled script for non-trivial changes.
- Never delete or overwrite production guest records without explicit owner approval.

## Testing
Test uniqueness, declined/attending count rules, guestbook public filtering, TTL rate-limit counters, connection reuse and safe handling of missing records.

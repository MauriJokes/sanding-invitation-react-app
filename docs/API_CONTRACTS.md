# API Contracts

The routes below are logical recommendations. Adapt the exact Vercel file layout to the selected runtime conventions.

## Common response shape

Success:

```json
{
  "data": {},
  "error": null
}
```

Failure:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your responses."
  }
}
```

`error.fields` is an optional array of field names (never values) on `VALIDATION_ERROR` and `ATTENDEE_LIMIT_EXCEEDED`, so the form can focus the right input. The UI maps `error.code` to its own Malay/English copy; `message` is an English fallback.

Do not expose stack traces, database errors, tokens or internal implementation details.

## Shared pipeline (public JSON POST routes)

Order of checks, so cheap rejects never touch the database: method (`405` with `Allow: POST`, which also covers `OPTIONS`; no CORS headers are ever sent) → `Content-Type: application/json` (`415 UNSUPPORTED_MEDIA_TYPE`) → bounded body (`413 PAYLOAD_TOO_LARGE`; 4096 bytes, 512 for `/api/rsvp/config`; checked by declared length and again while streaming) → JSON parse (`400 BAD_REQUEST`) → Zod validation (`400 VALIDATION_ERROR`; unknown keys such as a client `guestType` are stripped, not trusted) → rate limit (`429 RATE_LIMITED` with `Retry-After`) → feature handler. If the database has not been set up (the unique `canonicalGroupKey` index is missing), both `/api/rsvp` routes return `503 SERVICE_NOT_READY` with a generic message and write nothing; the form then shows its "could not be loaded" state. Unexpected failures return a generic `500 INTERNAL_ERROR`; logs hold the failure class or the missing variable names only.

Rate limits (fixed 10-minute windows per hashed client IP, scoped per route): `/api/rsvp` 10, `/api/rsvp/config` 30, `/api/guestbook` GET 120 and POST 20.

## Event information

There is no events endpoint. Public event details are typed configuration in `shared/` bundled into the client.

## POST /api/rsvp

Public, rate-limited, insert-only endpoint. No per-guest token, login, or group lookup is required. An optional shared `invite` value, if valid, selects the internal attendee limit; the client never sends `guestType`.

Example requests (overall RSVP for the Sanding celebration):

```json
{ "familyGroupName": "The Ahmad Family", "phoneNumber": "+673 812 3456", "attendeeCount": 5, "status": "attending", "invite": "<optional shared code>" }
{ "familyGroupName": "The Lim Family", "phoneNumber": "+673 712 3456", "attendeeCount": 0, "status": "declined" }
```

`invite` is optional and is omitted for external guests. A wrong value is treated as external and gets the same response as a missing one, so validity is never revealed.

Server validation:
- Validate the family/group name: whitespace trimmed and collapsed, Unicode NFC, 2 to 100 characters, no control, format (zero-width, bidi) or similar characters.
- Validate `phoneNumber`: at most 20 characters of digits, `+`, spaces, dashes and brackets; it must parse as a valid international number (country code required) and is stored in E.164. An invalid or missing value returns `400 VALIDATION_ERROR`.
- Generate the canonical group key on the server; never trust a client-supplied key.
- Validate `invite` with Zod (optional string, bounded length). Compare it to `INTERNAL_INVITE_CODE` in constant time and derive `guestType` (`internal` | `external`).
- Validate status and attendee count: `attending` is 1 to the maximum for the derived `guestType` (internal 10, external 2); `declined` must be 0. Exceeding the limit returns `400` with code `ATTENDEE_LIMIT_EXCEEDED` and a message stating only the applicable maximum; attending with 0, or declining with a non-zero count, returns `400 VALIDATION_ERROR`.
- Enforce the RSVP deadline server-side (closed returns `409` with code `RSVP_CLOSED`).
- Insert only; do not upsert or update an existing RSVP.
- Enforce duplicate protection with a unique database index and handle concurrent duplicate-key errors.
- Return a neutral duplicate response (`409`, code `RSVP_DUPLICATE`) without exposing the existing record or attendee count.
- Success returns `201` with only `{ "status", "attendeeCount" }` (never the id, `guestType` or any stored field).
- After the insert, await the Sheets append (see `GOOGLE_SHEETS_SYNC.md`; **added in M5**, until then documents stay `sheetStatus: "pending"`); a Sheets failure never changes the `201` response.
- Apply rate limiting (MongoDB TTL counters keyed by salted-HMAC hashed IP) and request-size limits (see the shared pipeline).

The public API must not provide an RSVP list, lookup by family name, or edit/update route.

## POST /api/rsvp/config

Public, rate-limited, read-only in effect (no data is written). It uses `POST` so the invite travels in the request body and never appears in a URL or access log. Responses are never cached.

```json
{ "invite": "<optional shared code>" }
```

Returns only the applicable limit and whether RSVP is open:

```json
{ "maxAttendees": 2, "rsvpOpen": true }
```

A valid invite returns `10`. A missing, wrong or rotated invite returns `2` with the same response shape; do not reveal whether an invite was recognised. Do not log request bodies.

## GET /api/guestbook

Public, rate-limited (120 per 10 minutes per hashed IP), cursor-paginated, never cached.

Query: `limit` (integer 1 to 50, default 20) and `cursor` (opaque value from a previous response). Anything else, or an invalid value, returns `400 VALIDATION_ERROR`.

```json
{ "data": { "entries": [ { "displayName": "Aisyah", "message": "Selamat!", "createdAt": "2026-12-01T10:00:00.000Z" } ], "nextCursor": "1781000000000_<24 hex>" }, "error": null }
```

Newest first, ordered by `(createdAt, id)` descending, so entries with the same timestamp are neither skipped nor repeated. `nextCursor` is `null` on the last page (also when the last page is exactly full). Only entries with `isPublic: true` are ever returned, and only these three fields: never ids, flags, sheet status or anonymous entries. Served from the `{ isPublic, createdAt, _id }` index.

## POST /api/guestbook

Public, rate-limited (20 per 10 minutes per hashed IP; deliberately generous because guests at the venue may share one Wi-Fi address), insert-only, body up to 8 KB.

```json
{ "displayName": "A guest", "message": "Wishing you both a wonderful life together.", "anonymous": false, "homepage": "" }
```

- `displayName` is required, 1 to 60 characters after normalisation (Unicode NFC, whitespace collapsed, trimmed); control, zero-width and bidi characters are rejected. A blank or missing name returns `400 VALIDATION_ERROR` naming `displayName`. `anonymous: true` keeps the entry private: stored and mirrored to Sheets with the name, never shown publicly.
- `message` is required, 1 to 500 characters after normalisation (Unicode NFC, whitespace collapsed, line breaks kept with at most one blank line in a row, trimmed). Control, zero-width and bidi characters are rejected.
- `homepage` is the hidden spam trap: a real browser sends it empty. Any non-blank value returns `400 VALIDATION_ERROR` with the generic message and **no field names**, and stores and mirrors nothing.
- Unknown keys (for example `isPublic`) are ignored.
- Respond `201` with `{ "published": true | false }` so the UI can show the right confirmation.
- After the insert, await the Sheets append to the `Guestbook` worksheet; failure leaves `sheetStatus: "pending"` and does not affect the response.
- Render stored content as text.

`PUT`, `PATCH`, `DELETE` and `OPTIONS` return `405` with `Allow: GET, POST`. There is no public edit or delete.

## HTTP semantics

Use:
- `200` for successful reads and `201` for a newly created RSVP.
- `201` for newly created guestbook entries where appropriate.
- `400` for malformed requests.
- `401`/`403` are not used: there are no protected public routes and no internal routes.
- `404` for unavailable resources where revealing existence is safe.
- `409` for conflicting state: `RSVP_DUPLICATE` and `RSVP_CLOSED`.
- `429` for rate limiting.
- `503` (`SERVICE_NOT_READY`) when the database is not set up (missing unique index).
- `500` for unexpected internal failures.

Avoid leaking whether a token, group or individual guest exists when that would enable enumeration.

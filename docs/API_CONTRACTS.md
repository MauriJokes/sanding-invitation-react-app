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

Do not expose stack traces, database errors, tokens or internal implementation details.

## Event information

There is no events endpoint. Public event details are typed configuration in `shared/` bundled into the client.

## POST /api/rsvp

Public, rate-limited, insert-only endpoint. No per-guest token, login, or group lookup is required. An optional shared `invite` value, if valid, selects the internal attendee limit; the client never sends `guestType`.

Example requests (overall RSVP for the Sanding celebration):

```json
{ "familyGroupName": "The Ahmad Family", "attendeeCount": 5, "status": "attending", "invite": "<optional shared code>" }
{ "familyGroupName": "The Lim Family", "attendeeCount": 0, "status": "declined" }
```

`invite` is optional and is omitted for external guests. A wrong value is treated as external and gets the same response as a missing one, so validity is never revealed.

Server validation:
- Validate and trim the family/group name.
- Generate the canonical group key on the server; never trust a client-supplied key.
- Validate `invite` with Zod (optional string, bounded length). Compare it to `INTERNAL_INVITE_CODE` in constant time and derive `guestType` (`internal` | `external`).
- Validate status and attendee count: `attending` is 1 to the maximum for the derived `guestType` (internal 10, external 2); `declined` must be 0. Exceeding the limit returns `400` with a message stating only the applicable maximum.
- Enforce the RSVP deadline server-side (closed returns `409` with code `RSVP_CLOSED`).
- Insert only; do not upsert or update an existing RSVP.
- Enforce duplicate protection with a unique database index and handle concurrent duplicate-key errors.
- Return a neutral duplicate response (`409`, code `RSVP_DUPLICATE`) without exposing the existing record or attendee count.
- After the insert, await the Sheets append (see `GOOGLE_SHEETS_SYNC.md`); a Sheets failure never changes the `201` response.
- Apply rate limiting (MongoDB TTL counters keyed by hashed IP) and request-size limits.

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

Public, rate-limited, cursor-paginated (default and maximum page size bounded; newest first).

Returns only entries with `isPublic: true`, and only `displayName`, `message`, `createdAt`. Anonymous entries are never returned.

## POST /api/guestbook

Public, rate-limited, insert-only.

```json
{ "displayName": "A guest", "message": "Wishing you both a wonderful life together.", "anonymous": false }
```

- `displayName` is optional. A blank name or `anonymous: true` makes the entry anonymous (stored and mirrored to Sheets, never shown publicly). If a name is supplied with `anonymous: true` it is still stored for the couple.
- Validate maximum lengths; reject empty messages and a filled honeypot field.
- Respond `201` with `{ "published": true | false }` so the UI can show the right confirmation (anonymous entries are not displayed).
- After the insert, await the Sheets append to the `Guestbook` worksheet; failure leaves `sheetStatus: "pending"` and does not affect the response.
- Render stored content as text.

## HTTP semantics

Use:
- `200` for successful reads and `201` for a newly created RSVP.
- `201` for newly created guestbook entries where appropriate.
- `400` for malformed requests.
- `401`/`403` are not used: there are no protected public routes and no internal routes.
- `404` for unavailable resources where revealing existence is safe.
- `409` for conflicting state: `RSVP_DUPLICATE` and `RSVP_CLOSED`.
- `429` for rate limiting.
- `500` for unexpected internal failures.

Avoid leaking whether a token, group or individual guest exists when that would enable enumeration.

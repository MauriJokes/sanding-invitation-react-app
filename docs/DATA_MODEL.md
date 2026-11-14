# Data Model

The RSVP is intentionally aggregate and family/group-based. There are no individual guest records, invitation-group access tokens, or guest accounts in the initial release. The website covers the Sanding celebration (Walimatulurus) only, so RSVPs have no event dimension.

## 1. FamilyGroupRSVP (`rsvps`)

```ts
type RSVPStatus = "attending" | "declined";
type GuestType = "internal" | "external";
type SheetStatus = "pending" | "synced";

const MAX_ATTENDEES: Record<GuestType, number> = { internal: 10, external: 2 };

interface FamilyGroupRSVP {
  _id: ObjectId;
  familyGroupName: string;
  canonicalGroupKey: string; // server-generated normalised value
  status: RSVPStatus;
  attendeeCount: number; // attending: 1..max for guestType; declined: 0
  guestType: GuestType; // derived server-side from the verified invite; "external" by default
  createdAt: Date;
  sheetStatus: SheetStatus; // "pending" until the Sheets append succeeds
  sheetSyncedAt?: Date;
}
```

Indexes:
- Unique index on `canonicalGroupKey`.
- Partial index `{ sheetStatus: 1 }` where `sheetStatus = "pending"` (used only by the backfill script).

Rules:
- Generate `canonicalGroupKey` on the server by trimming, collapsing whitespace, Unicode-normalising (NFKC) and case-folding the submitted name. Do not strip words such as "The" or "Family".
- `attending` requires `1 <= attendeeCount <= MAX_ATTENDEES[guestType]`. `declined` requires `attendeeCount = 0`.
- Derive `guestType` on the server by comparing the submitted `invite` with `INTERNAL_INVITE_CODE` in constant time; anything else is `external`. Do not store the invite code.
- `guestType` does not affect uniqueness.
- Do not expose existing RSVP details on duplicate detection.
- Never update or overwrite an accepted RSVP through the public API. The only post-insert write is the server setting `sheetStatus`/`sheetSyncedAt`.
- If the family/group name is too ambiguous as a duplicate key, resolve the convention with the couple; do not silently add phone/email fields.

## 2. GuestbookEntry (`guestbookEntries`)

```ts
interface GuestbookEntry {
  _id: ObjectId;
  displayName?: string; // optional; may be stored for anonymous entries so the couple can see it in Sheets
  message: string;
  isPublic: boolean; // true only when a name was given and "Send anonymously" was not ticked
  createdAt: Date;
  sheetStatus: SheetStatus;
  sheetSyncedAt?: Date;
}
```

Indexes:
- `{ isPublic: 1, createdAt: -1, _id: -1 }` for cursor-paginated public reads.
- Partial index `{ sheetStatus: 1 }` where `sheetStatus = "pending"`.

Rules:
- Store plain text. Do not store rendered HTML.
- A blank name means anonymous (`isPublic = false`).
- Public reads filter on `isPublic: true` and project only `displayName`, `message`, `createdAt`.
- Anonymous entries are never returned by any public endpoint.

## 3. RateLimit (`rateLimits`)

```ts
interface RateLimit {
  _id: string; // `${route}:${hashedIp}:${windowStart}`
  count: number;
  expiresAt: Date; // TTL index: expireAfterSeconds 0
}
```

- `hashedIp` is the first 32 hex characters of an HMAC-SHA-256 of the client IP keyed by `RATE_LIMIT_SALT` (server-only). Raw IPs are never stored. `windowStart` is the window index (`floor(now / windowMs)`), and `expiresAt` is the end of that window; Atlas removes expired documents within about a minute.
- Fixed-window counter updated atomically with `findOneAndUpdate({ _id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true })`.
- Rate limiting is best-effort abuse control, not authentication.

## 4. Events

Initially use typed application configuration shared by browser and server (`shared/`). There is one event.

```ts
interface WeddingEvent {
  id: string; // "sanding"
  title: string; // "Walimatulurus"
  startsAt: string; // ISO-8601 with explicit offset, e.g. 2026-12-28T19:15:00+08:00
  endsAt?: string; // unknown; omit until confirmed
  venueName: string;
  venueRoom?: string;
  venueAddress?: string;
  description?: string;
  dressCode?: string;
  directionsUrl?: string;
}
```

Configure the venue timezone (`Asia/Brunei`) and the RSVP deadline in the same file. The deadline is currently a placeholder (`2026-12-20T23:59:59+08:00`, open through the end of 20 Dec; marked `TODO(owner)`).

## 5. Data integrity invariants

1. One accepted RSVP per canonical family/group.
2. `attending` count is an integer within the bounds for the RSVP's `guestType`; `declined` count is 0.
3. Public RSVP submissions are insert-only; there is no public update operation.
4. Public visitors cannot list or read RSVP submissions or anonymous guestbook entries.
5. A MongoDB write never depends on Sheets. A failed Sheets append leaves `sheetStatus = "pending"`.
6. Sheets rows are keyed by the stable MongoDB `_id`; the backfill script skips IDs already present.
7. MongoDB remains authoritative; Sheets is a one-way mirror.

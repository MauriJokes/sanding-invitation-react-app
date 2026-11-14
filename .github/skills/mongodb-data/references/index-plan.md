# Initial Index Plan

Validate with actual query patterns before finalising. Create via `scripts/` only.

- `rsvps`: unique `{ canonicalGroupKey: 1 }`
- `rsvps`: partial `{ sheetStatus: 1 }` where `sheetStatus = "pending"`
- `guestbookEntries`: `{ isPublic: 1, createdAt: -1, _id: -1 }`
- `guestbookEntries`: partial `{ sheetStatus: 1 }` where `sheetStatus = "pending"`
- `rateLimits`: TTL `{ expiresAt: 1 }` with `expireAfterSeconds: 0`

Do not add every possible index. Indexes have write and storage costs; justify each one.

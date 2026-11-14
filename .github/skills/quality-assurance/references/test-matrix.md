# Minimum Test Matrix

| Area | Scenario |
|---|---|
| RSVP submission | Valid family/group RSVP |
| RSVP validation | Empty or malformed family/group name |
| RSVP validation | Attendee count below/above allowed bounds |
| RSVP guest type | Valid invite accepts 10, rejects 11; clean link accepts 2, rejects 3 |
| RSVP guest type | Wrong/rotated invite applies external limit with no validity leak; tampered client limit or `guestType` is ignored |
| RSVP invite | `localStorage` persistence, URL stripping, stale stored invite cleared; `POST /api/rsvp/config` returns 10/2 (invite in body, never in the URL) |
| RSVP duplicate | Canonically equivalent family/group name |
| RSVP duplicate | Concurrent duplicate submissions |
| RSVP persistence | Attending response |
| RSVP persistence | Declined response stores 0 attendees; attending 0 rejected |
| RSVP immutability | No public update/edit route |
| RSVP privacy | No public RSVP list or lookup |
| Idempotency | Retry after successful insert does not create duplicate |
| Deadline | Submission after cutoff |
| Sheets | Each RSVP/guestbook entry appended once to the right worksheet |
| Sheets | Google API failure leaves `pending`; backfill appends it once; repeated backfill is idempotent |
| Sheets | Formula-like values stay as text |
| Guestbook | Named entry published immediately; anonymous entry stored but never public |
| Guestbook | Oversized/empty payload |
| Guestbook | Markup rendered as text |
| Abuse | Rate limit exceeded (TTL counters, hashed IP; no raw IP stored) |
| Frontend | Mobile and desktop |
| Accessibility | Keyboard and reduced motion |
| Resilience | Page still works after a translator rewrites its text nodes; a render crash shows the reload message, not an empty page |
| Security | No secret in client bundle |
| Deployment | Production smoke test |

# Confirmed RSVP Decisions

- Public, non-personalised website.
- Website scope: **Sanding celebration only**.
- One RSVP per family/group for Sanding.
- One representative enters one total attendee count.
- Two shared links: external guests get the clean URL; internal guests get the same URL with `?invite=<code>`, where the code is a single shared secret held in the server environment. It is not a per-guest token, login or personalised link.
- Attendee limit per RSVP: valid invite (internal) = 10 pax; no, wrong or expired invite (external) = 2 pax.
- The server verifies the invite (constant-time comparison), derives `guestType` itself and enforces the limit. The UI limit is a convenience only; the client never sends `guestType`.
- The client reads `invite`, stores it in `localStorage` (internal guests only), removes it from the address bar and reuses it on later visits. A stored value the server rejects is cleared.
- The derived `guestType` is stored on the RSVP for reporting; the invite code itself is never stored or mirrored.
- No per-event attendance selection or counts.
- `attending` is 1 to the maximum for the verified guest type; `declined` is 0.
- RSVP deadline: placeholder 2026-12-20 23:59 `Asia/Brunei`, pending owner confirmation.
- No public RSVP edits or replacement submissions.
- Duplicate canonical family/group submissions are rejected.
- MongoDB is the source of truth; Google Sheets is a downstream write-through mirror.

Duplicate detection is based on a canonicalised family/group name. Since the website does not identify visitors, differently worded names for the same family cannot be perfectly matched without an additional identifier. The form should instruct families to use a consistent family/group name.

The shared invite code is a soft control, not authentication: anyone who receives or is forwarded the internal link gets the 10-pax limit. Rotating `INTERNAL_INVITE_CODE` invalidates old links. `localStorage` cannot lock anyone to 2 pax; the clean link is already the default.

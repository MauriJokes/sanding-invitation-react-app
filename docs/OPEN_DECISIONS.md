# Open Decisions and Assumptions Register

The product-access and RSVP decisions below are confirmed. Remaining rows concern content or optional operational details; do not invent missing wedding information.

| ID | Decision | Current status / required input |
|---|---|---|
| D-01 | Website access | **Confirmed:** fully public, non-personalised invitation website. |
| D-02 | RSVP identity/access | **Confirmed:** no personalised links, per-guest invitation codes, tokens, or guest login. Sole exception: one shared `invite` code that unlocks the internal attendee limit (see D-20). |
| D-03 | RSVP granularity | **Confirmed:** one submission per family/group, submitted by one representative; record total attendee count, not individual guest responses. |
| D-04 | Duplicate handling | **Confirmed:** do not support edits. Detect repeat submissions for the same family/group and reject/ignore them; do not overwrite the first accepted response. Define a reliable group identifier before implementation (recommended: family/group name normalised for case and whitespace, with a review process for ambiguous matches). |
| D-05 | Maximum attendee count | **Confirmed:** internal 10 pax; external 2 pax (see D-20). Still open: whether the form shows a numeric selector or stepper. Do not allow unbounded counts. |
| D-06 | Event-specific RSVP | **Confirmed:** one overall RSVP for the Sanding celebration only. No per-event data. |
| D-07 | Event list and eligibility | **Confirmed:** single event, Walimatulurus, 2026-12-28, arrival 19:15 (end time intentionally not published; no parking/arrival text), The Rizqun International Hotel, Songket Ballroom. End time unknown (leave unset). All guests are invited. |
| D-08 | RSVP deadline | **Placeholder:** 2026-12-20 23:59 `Asia/Brunei` in typed config, marked `TODO(owner)`. Owner to confirm with family. |
| D-09 | Guestbook identity | **Confirmed:** display name optional; "Send anonymously" checkbox; blank name = anonymous. Anonymous entries are stored and mirrored to Sheets but never shown publicly. Named entries are shown newest first. |
| D-10 | Guestbook abuse handling | **Confirmed:** immediate publication of named entries; length limits, MongoDB TTL rate limits (hashed IP), honeypot, plain-text rendering, owner-controlled manual removal. |
| D-11 | Guestbook retention | **Default adopted (owner may override):** entries stay until the owner removes them manually; nothing is auto-deleted. |
| D-12 | Languages | **Default adopted (owner may override):** Malay/English toggle, Malay shown first. Agent drafts UI strings in both languages; owner proofreads the Malay (including dress code). |
| D-13 | Venue timezone | **Confirmed:** `Asia/Brunei` (UTC+8, no DST). |
| D-14 | Google Sheets | **Confirmed:** MongoDB is authoritative; Sheets is a one-way mirror. Write-through on each submission with a `sheetStatus` pending flag and a manual backfill script; no scheduled sync (Vercel Hobby). |
| D-15 | Sheets layout | **Confirmed:** two worksheets, `Family RSVP` and `Guestbook` (see `GOOGLE_SHEETS_SYNC.md`). No secrets. |
| D-16 | Music asset | Owner will supply later. Drop the original in `design-assets/audio/`. Must be owned or properly licensed. |
| D-17 | Design direction | **Confirmed (M1 closed):** Direction A (navy), tokens, Allura + Cormorant Garamond, tile pattern, rotating rosettes on cover and hero, tassel + medallion corners, bottom/top navigation, Malay UI strings. Recorded in `docs/DESIGN_SYSTEM.md` and `docs/UI_COPY.md`. Monogram is a placeholder until the owner supplies the original. |
| D-18 | Database and Google access | **Confirmed by owner:** MongoDB Atlas and Google service-account access are configured. Keep credentials in local/Vercel environment variables only. |
| D-19 | Admin interface | **Confirmed:** Google Sheets; no separate admin dashboard in initial release. |
| D-20 | Internal vs external guest link | **Confirmed:** external guests use the clean URL (max 2 pax); internal guests use `?invite=<shared code>` (max 10 pax). The code is a server-side secret (`INTERNAL_INVITE_CODE`); the server verifies it and derives `guestType`. Internal guests' browsers keep the code in `localStorage`. `POST /api/rsvp/config` returns the applicable maximum. Not authentication. |
| D-21 | Invite transport to the config endpoint | **Confirmed:** `POST /api/rsvp/config` with the invite in the JSON body (never the query string). The browser link stays `?invite=<code>`. |
| D-22 | Rate limiting | **Confirmed:** MongoDB TTL collection keyed by salted-SHA-256 hashed IP (`RATE_LIMIT_SALT`). |
| D-23 | Hosting plan | **Confirmed:** Vercel Hobby. No cron jobs. |
| D-24 | Attendee count rule | **Confirmed:** `attending` is 1 to max (internal 10, external 2); `declined` is 0. |
| D-25 | Invitation title | **Confirmed:** display "Walimatulurus". |
| D-26 | Technical bounds (agent defaults, owner may override) | Family/group name 2 to 100 characters with no control or zero-width characters; request body up to 4 KB; rate limits per hashed IP per 10 minutes: RSVP 10, config 30. These are abuse and data-integrity guards, not business rules. |

## Duplicate RSVP implementation note

Because the site is intentionally public and has no personalised invite link or login, the system cannot prove that two different submissions with similar names belong to the same household. Implement a practical duplicate guard using a canonicalised family/group name (trim whitespace, collapse repeated spaces, case-fold, and normalise Unicode) with a unique database index for the selected event scope. Show a neutral “An RSVP for this family/group has already been received” message when a match is found. Do not expose the existing attendee count or other submission details. If the family/group naming convention is not reliable enough, ask the couple to choose a short family reference field before coding rather than adding phone/email collection by default.

## Guardrails

- The invitation website and RSVP form are public; do not introduce access tokens or guest accounts. The single shared `invite` code is the only permitted link differentiation.
- Never trust the client-displayed limit; derive the maximum attendee count from the server-verified invite.
- Do not expose the RSVP list or guest personal data to public visitors.
- Do not provide an edit or update endpoint. A correction process, if ever needed, is handled by the couple outside the public form.
- Enforce attendee-count bounds and duplicate checks on the server.
- Never expose MongoDB or Google service-account credentials to the browser.
- Keep MongoDB as the source of truth and Google Sheets as a one-way mirror.

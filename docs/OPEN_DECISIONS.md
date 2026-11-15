# Open Decisions and Assumptions Register

The product-access and RSVP decisions below are confirmed. Remaining rows concern content or optional operational details; do not invent missing wedding information.

| ID | Decision | Current status / required input |
|---|---|---|
| D-01 | Website access | **Confirmed:** fully public, non-personalised invitation website. |
| D-02 | RSVP identity/access | **Confirmed:** no personalised links, per-guest invitation codes, tokens, or guest login. Sole exception: one shared `invite` code that unlocks the internal attendee limit (see D-20). |
| D-03 | RSVP granularity | **Confirmed:** one submission per family/group, submitted by one representative; record total attendee count, not individual guest responses. |
| D-04 | Duplicate handling | **Confirmed:** do not support edits. Detect repeat submissions for the same family/group and reject/ignore them; do not overwrite the first accepted response. Define a reliable group identifier before implementation (recommended: family/group name normalised for case and whitespace, with a review process for ambiguous matches). |
| D-05 | Maximum attendee count | **Confirmed:** internal 10 pax; external 2 pax (see D-20), shown with a stepper (the prototype the owner approved). Counts are bounded in the UI and on the server. |
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
| D-16 | Music asset | Owner supplied a track (a commercial recording, "Risk It All"). Must be owned or properly licensed, so it is **git-ignored and not committed or deployed**. The owner chose to accept the licensing risk, but the assistant will not commit or publish a commercial recording; it needs a licensed or royalty-free track (or written permission). Code is ready: `public/audio/music.mp3`. |
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
| D-27 | RSVP UI defaults (agent defaults, owner may override) | The count starts at 1. The language starts in Malay and is not remembered between visits. An invite in the link wins over a stored one, and a rejected one is forgotten with no message. The browser does not remember that a family already submitted (the server rejects duplicates). After a failed or unanswered submission the guest keeps their details and can retry; if the same submission then comes back as a duplicate, the message says the earlier attempt may have gone through. Drafted error and confirmation copy is in `docs/UI_COPY.md` and awaits proofreading. |
| D-28 | Browser machine-translation (agent default, owner may override) | **Off.** `<html translate="no">` and `<meta name="google" content="notranslate">`. The site has its own Malay/English switch, translators mangle names, and page translation rewrites the DOM, which crashed the RSVP page in M4 (see `docs/ARCHITECTURE.md`). Guests who read neither language lose the browser's translate offer. To reverse, remove both hints; the page is also hardened against translators and has an error fallback. |
| D-29 | Unique-index safety check | **Confirmed by owner:** the RSVP API refuses requests (503 `SERVICE_NOT_READY`) when the unique `canonicalGroupKey` index is missing, instead of silently accepting duplicates. Run `npm run db:indexes` on every database. |
| D-30 | Guestbook and Sheets defaults (agent defaults, owner may override) | Name up to 60 and wish up to 500 characters; public pages of 20 (max 50), newest first; rate limits per hashed IP per 10 minutes: write 20, read 120 (generous because guests at the venue may share one Wi-Fi address); a filled honeypot is rejected with a generic 400 (not silently dropped, so a real person whose autofill filled it still sees an error); a blank Sheets tab-name variable means the default; the Sheets call has a 5 s deadline and the guest's response never depends on it; no guestbook duplicate guard (a resubmitted wish after a lost response can appear twice; the owner removes one, see `docs/OPERATIONS.md`). |
| D-31 | Cover plaque colour | **Confirmed by owner:** keep the plaque deep navy (`navy-deep`) with gold and ivory text and gold hairlines. The lighter steel-blue panel in the reference (#576a83) was rejected because gold text on it scores 2.6:1 and ivory 4.3:1, below the 4.5:1 needed for small text. |
| D-32 | Cover botanicals and the bouquet corner | **Deferred to backlog B-1 (2026-11-15).** When revived, **confirmed by owner:** compose the four corners from the supplied assets only (eucalyptus, fern, gold leaves, anemone cluster, white blossoms). No roses, white anemone or berries exist in the assets and none will be drawn. The owner may supply them later. |
| D-33 | Botanical source files (agent default) | **Deferred to backlog B-1;** the git-ignore rule stays. The supplied SVGs are bitmaps wrapped in SVG (about 68 MB) and are **git-ignored**. A local script turns them into small WebP-with-alpha files (cover budget 600 KB) that are committed in `src/assets/botanicals/`. The owner keeps the originals on their machine (back them up elsewhere). |
| D-34 | Botanical motion (agent defaults, owner may override) | **Deferred to backlog B-1.** Subtle and desynchronised: leaves sway 1.5 to 3 degrees, flowers breathe about 1.5 degrees and 1% scale, small blossoms turn up to 4 degrees, 6 to 8 loose petals drift on the cover. Transform and opacity only, static under reduced motion, stopped once the cover has opened. To be reviewed on a prototype and tuned by the owner. |

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

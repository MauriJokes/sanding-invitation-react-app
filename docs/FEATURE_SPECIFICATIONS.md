# Feature Specifications

## F-01 — Invitation landing page

### Purpose
Present the wedding invitation as a polished, memorable digital experience.

### Requirements
- Provide an initial invitation/cover state and a clear way to reveal the invitation.
- Display approved couple names, wedding identity, event summary and navigation.
- Support the agreed Malay/English language experience once confirmed.
- Include responsive navigation and clear section hierarchy.
- Provide accessible controls and visible keyboard focus.
- Avoid requiring sound to understand the experience.

### Acceptance criteria
- First-time visitors can understand how to open or enter the invitation.
- All primary content is readable on mobile and desktop.
- The page remains usable with JavaScript motion reduced or disabled.
- No essential information is available only through animation or audio.

## F-02 — Public family/group RSVP

### Purpose
Allow one representative to submit an RSVP for the entire family/group through the public, non-personalised invitation website.

### Requirements
- The RSVP form is publicly accessible; no login, invitation token, personalised link, or group lookup is required.
- Two audiences share one site. External guests open the clean URL (max 2 pax). Internal guests open the URL with `?invite=<code>` (max 10 pax). The code is one shared secret held in `INTERNAL_INVITE_CODE`.
- The client reads `invite` from the URL, saves it to `localStorage` (internal guests only), removes it from the address bar with `history.replaceState`, and reuses the stored value on later visits. If the server rejects a stored value, the client clears it and falls back to external.
- `POST /api/rsvp/config` (see API contract) returns the maximum for the supplied invite so the form can show the correct limit. A wrong or missing invite silently yields the external limit.
- `POST /api/rsvp` receives the invite; the server verifies it, derives `guestType`, and never accepts a client-supplied `guestType` or limit.
- Collect the family/group name, a contact phone number (international format with country code, e.g. `+673 812 3456`; owner decision D-36) and the total number of attendees.
- Configure a maximum attendee count per guest type (`internal` = 10, `external` = 2) and enforce it in both the UI and server-side validation, derived from the server-verified invite.
- The form shows the applicable maximum and does not reveal the other guest type's limit.
- Store the derived `guestType` on the RSVP; never store the invite code.
- Accept one submission per canonical family/group identifier.
- The first accepted submission is final. Do not provide edit, update, or overwrite functionality.
- Detect duplicate submissions using a canonicalised family/group name and a database unique index. Do not reveal existing RSVP details when rejecting a duplicate.
- Return a clear confirmation state after MongoDB persistence succeeds.
- Do not expose the RSVP list or any other family's submission to public visitors.
- MongoDB is authoritative; a Sheets sync failure must not invalidate a successful RSVP.

### Duplicate detection caveat
A public anonymous form cannot reliably identify a household if the submitter changes the family name spelling. Canonicalise whitespace, case and Unicode; explain that the family/group name should be entered consistently. The phone number is collected for contact only and is deliberately not used to detect duplicates. Do not add email collection without approval.

### Edge cases
- Missing or malformed family/group name.
- Missing phone number, or one without a country code, with letters, with control or zero-width characters, longer than 20 characters or not a possible number (all rejected in the browser and again on the server).
- Attendee count below one, above the maximum for the guest type, or not an integer.
- Missing, malformed, wrong or rotated invite: treat as external; never fail open to the internal limit.
- Invite removed, altered or cleared from `localStorage` between page load and submit; the server limit for what it verifies still applies.
- Internal guest with a stale stored invite after rotation: fall back to external and clear storage.
- Duplicate family/group submission.
- RSVP deadline passed.
- Concurrent duplicate submissions.
- Database write succeeds but Sheets sync fails.
- Network retry after a successful submission.

### Acceptance criteria
- A representative can submit the RSVP for the family/group in one form.
- The total attendee count is stored accurately.
- A clean-link RSVP cannot exceed 2 attendees and a valid-invite RSVP cannot exceed 10, in both UI and API.
- The stored RSVP records its derived `guestType`.
- Only one accepted RSVP exists for each canonical family/group.
- A duplicate does not overwrite the original response.
- There is no public edit/update flow or API endpoint.
- The phone number is stored in E.164 form, appears in the `Family RSVP` sheet, and is never returned to anyone but the guest who typed it.
- Public visitors cannot retrieve private RSVP records.
- Successful MongoDB writes remain successful even if Sheets is unavailable.

## F-03 — Guestbook

### Purpose
Allow visitors to share wedding wishes and read previously submitted messages

### Requirements
- Show the wishes as a slider, one wish at a time with the neighbours faded at the edges, newest first. Arrows, swipe, drag and arrow keys move it; a counter and progress line show the position. There is no list and no "Load more" button: older pages are fetched with the cursor as the guest nears the end.
- Auto-play moves on after a time that fits the message (about 6 to 14 seconds), loops to the newest wish only when no older ones remain, and pauses while the guest hovers, drags or focuses, while the tab is hidden or the slider is off screen, while the pop-up is open, and whenever the guest presses Pause. With reduced motion it starts paused and changes wish without sliding.
- "Leave a wish" opens a modal pop-up (`<dialog>`) with a required display name, a "Send privately" checkbox and a required message field. Escape, the close button or a click outside closes it. After sending, the pop-up thanks the guest; closing it returns the slider to the newest wish when the wish was published.
- Publish valid named submissions immediately; show them newest first.
- Private submissions (box ticked) are saved to MongoDB with their name and mirrored to the `Guestbook` worksheet but are never shown publicly. The confirmation text must say so. A submission without a name is rejected.
- Enforce maximum name and message lengths.
- Apply rate limits and basic abuse protection (honeypot field).
- Render messages as text; never interpret user content as HTML.
- Provide loading, empty, success and failure states. With one wish there are no arrows, counter or auto-play.
- Paginate retrieval with a cursor so the whole collection is never returned.
- The owner removes inappropriate entries manually (documented procedure); no moderation UI.

### Acceptance criteria
- Valid named messages appear in the public guestbook after successful submission; anonymous ones never do.
- HTML/script-like input is displayed harmlessly as text.
- Oversized and rate-limited submissions are rejected with useful messages.
- Public retrieval exposes only `displayName`, `message` and `createdAt` of public entries.

## F-04 — Event itinerary

### Requirements
- The single event (Sanding / Walimatulurus) is defined with a stable ID in typed `shared/` config.
- Each event can include title, date/time, end time, venue, description, dress code and directions URL.
- Display dates in the configured venue timezone.
- Event data is initially maintained in typed configuration, not an admin UI.
- Do not infer or fabricate missing event details.

### Acceptance criteria
- Event details match the approved source data.
- Dates and times are consistent across browsers in different timezones.
- Directions links are valid and clearly labelled.

## F-05 — Countdown

### Requirements
- Countdown target is configurable and tied to an event.
- Use the venue timezone for the target instant.
- Display days, hours, minutes and seconds, or an approved simpler presentation.
- Stop or change state after the target time.
- Avoid hydration/time mismatch if server-rendering is introduced later.

## F-06 — Location and directions

### Requirements
- Venue, address, directions and copy-address actions live in the Details section. The former standalone location section is now the prayer section (owner decision, 2026-11-17).
- Display approved venue name, address and relevant instructions.
- Provide an external map/directions link or an approved map embed.
- Do not expose private residential addresses unless explicitly approved.
- Make the address copyable where useful.
- Ensure the map is not the only way to access venue details.

### Prayer for the newlyweds
- Between RSVP and the guestbook, show a centred "Doa untuk Pengantin" section (`#prayer`), with "Doa" / "Prayer" in the navigation instead of "Lokasi" / "Location".
- Follow the owner's supplied reference for the reading order: opening calligraphy, heading, prayer, closing calligraphy. Use the existing ivory, navy, gold and Cormorant/Allura theme, not the reference's flowers or colours.
- Malay prayer wording is transcribed from the supplied reference with normal sentence casing; English is a draft translation for owner proofreading.
- Bismillah and Aamiin are the owner's calligraphy images with the `prayerOpening` / `prayerClosing` strings as alt text. The Details greeting uses the owner's salam image the same way.
- Keep the prayer static, readable on narrow screens, and independent of animation or audio.

## F-07 — Music

### Requirements
- One track only for initial release.
- Provide explicit play/pause control.
- Do not attempt to bypass browser autoplay restrictions.
- Do not block the invitation if audio fails.
- Use an owner-supplied or properly licensed audio file.
- Provide an accessible control label and visible playback state.

## F-08 — Animations and interactions

### Requirements
- Use motion to reinforce transitions and hierarchy.
- Respect `prefers-reduced-motion`.
- Avoid layout shifts and excessive animation.
- Avoid animating large, expensive surfaces continuously.
- Ensure interactions remain usable with keyboard and touch.
- Do not delay access to essential invitation information for decorative animation.

## F-09 — Google Sheets mirror

### Requirements
- MongoDB is authoritative; Sheets is a one-way mirror (see `GOOGLE_SHEETS_SYNC.md`).
- Write-through: each accepted RSVP and guestbook entry is appended to its worksheet (`Family RSVP`, `Guestbook`) after the MongoDB insert.
- Track `sheetStatus`; a failed append stays `pending`.
- A manual `scripts/backfill-sheets.ts` appends pending rows without duplicating existing IDs.
- Values are written with `RAW` so they cannot become formulas.
- Never include the invite code, secrets or IP data.

### Acceptance criteria
- A successful RSVP or guestbook entry is persisted even when Sheets is unavailable.
- Each accepted submission appears once in the correct worksheet.
- Backfill brings the sheet into alignment with MongoDB and is safe to re-run.
- Failures are observable via pending counts without exposing secrets.

## Explicitly excluded
Photo gallery, guest uploads, standalone admin dashboard, two-way Sheets sync and guest accounts.

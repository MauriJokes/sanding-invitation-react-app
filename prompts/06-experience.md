# Milestone 6 — Guest Experience (revised plan)

Activate `wedding-ui-design`, `react-frontend`, `guestbook-interactions` and `quality-assurance`.

UX is the heart of this site, so M6 is delivered in **reviewable steps with an owner approval gate after each**. Nothing in a later step starts until the previous one is approved. Follow `docs/DESIGN_SYSTEM.md`; new colours, shapes or motion beyond it need approval first. No gallery.

Already built and approved: RSVP, guestbook, Sheets mirror, tokens, fonts, tile/rosette/tassel assets, and the cover, hero, corner and particle design (M1). M6 replaces the temporary hero and language toggle with the real experience.

## Step 6a — Cover and gate — approved

Build the **approved** cover from `docs/DESIGN_SYSTEM.md` §5a, ported from the archived prototype (`design-assets/archive/m1-prototype/index.html`):

- A deep navy plaque (D-31) with the monogram placeholder, "Walimatulurus", the names, the date and **Buka**, over two tile-pattern door panels.
- Rotating rosettes on the panels (skip those hidden under the plaque); pressing **Buka** fades the plaque, slides the panels apart onto the live page, then removes the cover so its animations stop.
- Page content is `inert` until opened; focus moves to the main heading; reduced motion turns the gate into a short crossfade; animation pauses when the tab is hidden.
- **Performance:** plaque text paints first; nothing blocks **Buka**. Measure frame times with 4x CPU throttling and report; if needed, reduce the rosette count (up to 113 on desktop, 48 on phones) by animating only those near the edges.
- **Review pack:** screenshots at 320, 375, 414, 768 and 1280 px and a short screen recording of the gate opening.

The botanical cover idea (new flower and leaf art around the diamond) is **parked in `docs/BACKLOG.md` (B-1)** and is not part of M6.

## Step 6b — Shell: navigation, hero, language and music control — approved

- Bottom bar below 768 px, sticky top bar from 768 px; BM/EN toggle and the music control in the bar; the temporary toggle is gone. The bar links only to sections that exist (today RSVP and Ucapan); Butiran and Lokasi appear when 6c and 6d add those sections, with no change to the bar.
- Hero with the approved corner medallions and tassels, the tile band with turning rosettes, drifting particles (mounted only once the gate has opened) and the entrance sequence, which starts when **Buka** is pressed so it lands as the doors open.
- The music control was a visual stub here; it is wired to the real track in 6e.
- The hero keeps the approved medallion corners; no botanicals (B-1 in `docs/BACKLOG.md`).

## Step 6c — Invitation, event and countdown — approved

Invitation text (adjusted for one event, duplicate greeting removed), hosts, couple, event facts (date, arrival 19:15, venue, no end time; no dress code, by owner decision), countdown to 2026-12-28 19:15 `Asia/Brunei` with a clear state after the date.

## Step 6d — Location and directions — approved

Venue, room and full address as plain text; "Buka di Peta" opens the owner's map link in a new tab (`noopener noreferrer`); "Salin alamat" copies the venue and address and says whether it worked; no embedded map. Placed between the RSVP and the guestbook, in the navigation bar as Lokasi. (Superseded in 6g: the owner moved the two buttons into the details section, side by side; the separate location section is to be replaced by the owner.)

## Step 6e — Music — built (licence still to be sorted by the owner, D-16)

One looping track from `public/audio/music.mp3`, started by the guest pressing Buka (D-35) or the music button, never on load (nothing is requested before then), failure shows "Muzik tidak tersedia" and never blocks the page. The owner committed the track and accepted the licensing risk (D-16); before launch it should be licensed or replaced.

## Step 6f — Assembly, desktop layout and hardening — built, awaiting owner review

- Section order: hero, details, countdown, RSVP, location, guestbook, with static tile dividers (wider from 768 px).
- Desktop: the details section widens to two family columns (bride's family, "&", groom's family) and three event facts in a row; the RSVP, location and guestbook stay in a single narrow column.
- Verified in Chromium, **WebKit (Safari engine) and Firefox** at phone and desktop sizes with a mocked API: gate, hero, countdown, navigation, RSVP submit, location copy, guestbook, language switch, translator simulation, reduced motion. Not verified: real iPhone/Android devices, real screen readers.
- Keyboard: only Buka is reachable while the gate is closed; focus moves to the heading after it opens; every tab stop has a visible 2 px ring; the fixed bottom bar never covers a focused field.
- Lighthouse (production build, local): performance 100, accessibility 100, best practices 96 (the local API 404), SEO 54 because the site is deliberately `noindex`.

## Step 6g — Owner review rounds

One or more rounds of feedback on the preview URL, with fixes, until the owner approves M6. Then M7 (production verification).

Changes made in these rounds (all approved by the owner):
- The owner edited the copy directly (`src/i18n/strings.ts`, `src/features/details/content.ts`): title "Walimatul Urus", the invitation lines, an itinerary instead of a guest-arrival fact, no RSVP scope note.
- RSVP full-width attendee stepper.
- RSVP phone number (D-36): validated in the browser and on the server, stored in E.164, mirrored to the `Family RSVP` sheet (new seventh column).
- Details section: the map and copy-address buttons sit side by side below the three facts.
- Guestbook slider with auto-play and a pop-up form, replacing the list (D-37, `DESIGN_SYSTEM.md` §5e).
- Tests were brought up to date: copy-dependent tests now read the strings from `strings.ts` instead of repeating them, so later copy edits do not break the build.

## Owner inputs still needed

- Feedback after each step's review pack.
- Licence decision for the music track (D-16). Original "IA" monogram file (placeholder until then).

Do not commit the heavy botanical source SVGs in `design-assets/textures/` (git-ignored).

# Milestone 6 — Guest Experience (revised plan)

Activate `wedding-ui-design`, `react-frontend`, `guestbook-interactions` and `quality-assurance`.

UX is the heart of this site, so M6 is delivered in **reviewable steps with an owner approval gate after each**. Nothing in a later step starts until the previous one is approved. Follow `docs/DESIGN_SYSTEM.md`; new colours, shapes or motion beyond it need approval first. No gallery.

Already built and approved: RSVP, guestbook, Sheets mirror, tokens, fonts, tile/rosette/tassel assets. M6 replaces the temporary hero and language toggle with the real experience.

## Step 6a — Botanical art pipeline and the new cover (first gate)

Source art is in `design-assets/textures/` (owner-supplied, git-ignored): `blue-flower` (navy anemone + two cream blossoms + gold line leaves, in two layers), `white-flower` (three blossoms, only 362 px wide), `branch-1`, `branch-2` (eucalyptus), `fern`, `golden-leaf-1`, `-2` (gold line art), `golden-leaf-3` (gold glitter). They are **bitmaps wrapped in SVG** (about 68 MB), so they must not ship or be committed as they are.

1. **Pipeline** (dev-only script, run locally, outputs committed): decode each source, join colour image and mask into transparency, trim, split `blue-flower` into a gold-leaf layer, a flower layer and the two small blossoms, resize to about 1.5x the largest displayed size, and write WebP with alpha into `src/assets/botanicals/`. Budget: **at most 600 KB for everything the cover loads**. Report sizes.
2. **Cover composition** (from the owner's reference `design-assets/moodboard/theme/photo_2026-11-15 02.32.41.jpeg`, adjusted by the decisions below):
   - Tile pattern fills the viewport. A portrait "card" (about 2:3) scales to fit and is centred; on desktop the tile continues to the sides.
   - A true rotated-square diamond in deep navy with a gold hairline outline, and a navy plaque with a double gold frame holding the monogram placeholder, "Walimatulurus", the names, the date and **Buka**. **Plaque stays deep navy with gold/ivory text (D-31).**
   - Four corner clusters around the diamond: top-left eucalyptus + gold line leaves; top-right anemone cluster; bottom-left fern + glitter gold leaf + white blossoms; bottom-right white blossoms + eucalyptus (D-32). Each cluster belongs to **one door half** and never crosses the centre seam, so the gate opens cleanly. A few gold confetti specks near the clusters (CSS, no image).
   - Clusters never cover text or the button; they take at most about a third of the width on a phone.
3. **Motion (subtle, desynchronised, transform and opacity only):**
   - Leaf sprays sway 1.5 to 3 degrees about the stem base, 6 to 11 s per cycle, each with its own duration and delay.
   - Anemone and blossoms "breathe": about 1.5 degrees of rotation and 1% scale over 7 to 10 s; the two small cream blossoms turn up to about 4 degrees.
   - 6 to 8 loose cream petals drift down slowly on the cover (simple vector petal, no new colours).
   - On **Buka** the botanicals ride their door and lean outward a few degrees as it slides; the cover is then removed so its animation stops.
   - Reduced motion: botanicals static, gate becomes a crossfade. Paused when the tab is hidden.
4. **Performance:** plaque text paints first and botanicals fade in as they decode (nothing blocks the Buka button). Measure frame times with 4x CPU throttling (and report); if needed, reduce the cover's 48 to 113 rotating rosettes (animate only those near the edges).
5. **Review pack:** screenshots at 320, 375, 414, 768 and 1280 px, plus a short screen recording of the gate and the idle motion, and the sizes report.

## Step 6b — Shell: navigation, hero, language and music control

Bottom navigation on mobile and top bar from 768 px (approved), BM/EN toggle in the bar, music button (UI only until the file arrives), hero entrance with the approved tile band, corners and particles. Replace the temporary toggle. Decide with the owner whether the hero also gets botanicals (default: no, keep the approved medallion corners).

## Step 6c — Invitation, event and countdown

Invitation text (adjusted for one event, duplicate greeting removed), hosts, couple, event facts (date, arrival 19:15, venue, no end time), dress code (Malay/English), countdown to 2026-12-28 19:15 `Asia/Brunei` with a clear state after the date.

## Step 6d — Location and directions

Venue block, copyable address, directions link (open in the maps app), no embedded map unless approved.

## Step 6e — Music

One track, explicit play/pause, never autoplay, failure never blocks the page. **Needs the owner's file in `design-assets/audio/`.** Until then the control is built and tested with a stub.

## Step 6f — Assembly, desktop layout and hardening

Section order from the approved flow; two-column details and wider tile borders on desktop; static tile dividers. Cross-browser checks in WebKit and Firefox (install Playwright browsers locally), keyboard and focus review, reduced motion, translator regression, performance pass, Lighthouse and axe.

## Step 6g — Owner review rounds

One or more rounds of feedback on the preview URL, with fixes, until the owner approves M6. Then M7 (production verification).

## Owner inputs still needed

- Feedback after each step's review pack.
- Music file (before 6e). Original "IA" monogram file (placeholder until then).
- Optional: a higher-resolution original of the white blossoms (the current one limits how large they can appear).

Do not commit the heavy source SVGs. Commit only optimised outputs.

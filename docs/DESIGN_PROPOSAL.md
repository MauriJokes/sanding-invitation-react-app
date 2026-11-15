# Design Proposal (M1)

Status: **approved by the owner (M1 closed).** Kept as the rationale and evidence record. The authoritative tokens, patterns and motion rules now live in `DESIGN_SYSTEM.md`; the prototype is archived at `design-assets/archive/m1-prototype/`.

Evidence: a throwaway prototype at `design-assets/archive/m1-prototype/index.html` (open it in a browser; `?theme=ivory` shows Direction B, `?open=1` skips the cover) and screenshots in `design-assets/archive/m1-prototype/screenshots/`. Theme and decoration come from `design-assets/moodboard/theme/` only; journey and flow come from `uiux-sample/` only.

## 1. Visual direction

A navy-and-ivory invitation in the spirit of your artwork: deep navy fields, ivory reading surfaces, antique-gold hairlines, and a blue/gold/ivory **tile pattern** used as borders, bands, gate panels and corner medallions, never behind text or forms. Typography leads; the tile is the ornament.

## 2. Two directions (Direction A approved)

| | **A. Navy Gate (recommended)** | **B. Ivory Paper** |
|---|---|---|
| Feel | Cinematic, matches the navy invitation you favour | Calm, stationery-like |
| Hero, countdown, location | Navy; particles and gold show clearly | Warm ivory; navy ink and navy tassels |
| Reading, RSVP, guestbook | Ivory panels | Ivory |
| Trade-off | More contrast between sections; navy bands must keep text contrast | Flatter; the particles and medallions have less impact |

Recommendation: **A.** It gives the opening-gate moment and the corner ornaments real presence, and it is closest to `sanding-invite.png`. B is a valid fallback, and is the same code with different colour variables.

## 3. Tokens (proposed)

Sampled = measured from your references. Derived = computed by me from a sampled colour. Please approve or adjust.

| Token | Hex | Origin | Use |
|---|---|---|---|
| navy | `#283368` | sampled (artwork) | Primary field |
| navy-deep | `#1b2352` | derived (navy ~30% darker) | Nav, gate panels, footer |
| periwinkle | `#7e8fb8` | sampled (artwork tile) | Tile detail |
| slate | `#4b5378` | sampled (artwork) | Input borders |
| ivory | `#e9e1d6` | sampled (photo swatch) | Reading surface, text on navy |
| ivory-2 | `#ddd3c3` | derived | Direction B bands |
| gold | `#b8a472` | sampled (artwork) | Hairlines, tile detail |
| gold-bright | `#cfac69` | sampled (photo swatch) | Gold text on navy |
| gold-ink | `#645020` | derived (gold, darkened) | Gold-toned text on ivory |
| burgundy | `#52222a` | sampled (photo swatch) | Sparing accent (dress-code swatch, notices) |
| sage | `#798776` | sampled (photo swatch) | Decoration only |

Contrast (WCAG ratios, computed): ivory on navy 9.19; ivory on navy-deep 11.5; gold-bright on navy 5.53; gold-bright on navy-deep 6.93; navy on ivory 9.19; gold-ink on ivory 5.98; gold-ink on ivory-2 5.23; burgundy on ivory 10.0; input border slate on field 6.53. The artwork's own gold (`#b8a472`) on navy is 4.87, so it is allowed for text only where `gold-bright` isn't used. Sage on ivory is 2.93: decoration only, never text.

No pure black or white is used. Spacing uses a 4 px base, content max-width 42 rem, breakpoints at 360 / 640 / 1024 px.

## 4. Typography (two families)

- **Allura** (script) for the couple's names and the footer sign-off only.
- **Cormorant Garamond** (serif) for everything else: tracked uppercase for labels and headings, 500 weight at 20 px (1.25 rem) for body, italic for helper text.

I tried Pinyon Script first and replaced it: its capital "I" reads like a "Z" in "Izyan". Allura is the clearest of the five I compared and the closest match to your invitation's script. Both are SIL OFL licensed and would be self-hosted as `woff2` (about 23 KB each; I'd ship only the weights actually used).

## 5. Flow (from `uiux-sample/`, adjusted to `docs/`)

Cover (gate) → hero (names, date, venue) → invitation text and details → countdown → RSVP → location → guestbook → footer. Navigation (owner request: bottom on mobile):
- **Below 768 px:** a fixed bottom bar with four icon-and-label anchors (Butiran, RSVP, Lokasi, Ucapan), then a divider and two icon-only controls (BM/EN and music). It respects the iOS safe area, marks the current section with a gold line as well as colour, and hides while a text field is focused so the on-screen keyboard is not crowded.
- **768 px and up (tablet and desktop):** the same links in a sticky top bar with the monogram on the left and the controls on the right.
- **Side rail not recommended:** the content is a single centred column, so a rail would add width and a second layout to maintain for no gain. Say so if you would still like to see it. No Money Gift, Wishlist, Contact or Calendar, and no programme list: there is one event with an arrival time and no end time.

## 6a. Hero animation (owner request: the hero felt plain)

Built in the prototype, using your idea of rotating tile circles:
- **Tile band.** A full-width tile strip (168 px) rises at the bottom of the hero. Its rosettes (the navy circles of the tile) rotate slowly, each in its own direction and speed (36 to 84 s per turn; 18 rosettes on a phone, mixed clockwise and anticlockwise). They stay below the text, so no pattern sits behind copy.
- **Entrance sequence.** After the gate opens, the heading, names, date and "Lihat butiran" fade up one after another and the band rises with them (about 2.5 s in total). Skipped under reduced motion.
- Together with the swaying corners, tassels and drifting particles, the hero now has four layers of motion, all slow and all `transform`/`opacity`.

**Cover fix (owner-reported).** The first version animated only the hero band; the cover doors used a static tile. The doors now carry the same rotating rosettes on the same 84 px grid (48 on a phone, about 113 on a 1280 px desktop; rosettes hidden under the navy wedge are skipped). The original gate shape and look are unchanged. Still static by design, unless you ask otherwise: the thin tile dividers between sections and the tile inside the corner medallions.

Options I did not build (say if you want one): the names "write in" from left to right; a single gold light sweep across the names after the entrance; or a larger rosette turning slowly behind the names at low opacity (I advise against that one, it puts pattern behind text).

## 6. What the prototype shows (Direction A unless stated)

- **Cover and gate.** Navy plaque on two tile-pattern doors with a monogram placeholder (typographic "IA"). The door rosettes rotate like the hero band's. Pressing **Buka** fades the plaque, then slides the doors apart over about 0.9 s onto the live hero; the cover is then removed from rendering so its animations stop.
- **Hero.** See §6a.
- **Corners.** A quarter tile-medallion in each top corner sways about ±1.5° and carries a swinging tassel (gold on navy, navy on ivory). Drawn as SVG.
- **Particles.** Gold specks and small tile-derived rosettes drift down behind content: 14 on mobile, 24 on desktop; paused when the tab is hidden.
- **Details.** Supplied copy only, adjusted for one event; Malay by default with an English toggle; the duplicate greeting is removed.
- **Countdown.** Flat typographic numerals with gold hairlines (no dark flip cards). Target `2026-12-28T19:15+08:00`.
- **RSVP.** Family/group name, attending or declined (segmented), a stepper that obeys the limit (2 shown; a prototype button toggles 10), the deadline notice, and a plain "Send RSVP" button. Declined hides the count.
- **Location and guestbook.** Venue block with map link and copy-address button; guestbook with optional name, "send anonymously" checkbox, and a plain-text sample list (the honeypot field is a build-time item, not in the prototype).

## 7. Verification actually performed

Headless Chrome at 375×812 and 1280×800:
- No horizontal overflow at either width, and no script errors.
- axe-core (WCAG 2.0/2.1 A/AA + best practice): Direction A clean; Direction B clean after I darkened `gold-ink` (it first scored 4.48:1 on ivory-2). The only remaining finding is the prototype's own control bar, which is not part of the design.
- Cover fix: rosettes on the cover rotate (transform changes over time, mixed directions, 0 script errors at 375 and 1280 px); after **Buka** the cover is removed (`display:none`) and none of its animations keep running; Replay rebuilds it; reduced motion turns the door rosettes off; axe is clean on the cover; Tab still lands on **Buka** first.
- Added after the revisions: axe is clean on both directions at 375, 768 and 1280 px; the rosettes really rotate (computed transform changes over time) in mixed directions; the nav marks the current section, hides while typing and does not cover the last content; with reduced motion the rosettes stop; the entrance sequence runs from fully hidden to fully visible in about 3.5 s. Layouts checked at 375x667, 375x812, 768x1024, 1024x600 and 1280x800 with no horizontal overflow.
- Keyboard: Tab reaches **Buka**; Enter opens the gate, removes `inert` from the page, hides the cover and moves focus to the main heading. Focus order through the page is logical; the disabled "−" is skipped.
- Reduced motion: corner sway, tassel swing and particles are off; the gate becomes a short crossfade.
- Direction B was rendered and scanned; Direction A's gate was captured mid-animation.

## 8. Not verified / limitations

- Real devices, Safari and Firefox: **not tested** (headless Chrome only). `inert` needs Safari 15.5+; the bottom bar uses `env(safe-area-inset-bottom)`, which I could not check on an iPhone.
- Animation smoothness and battery/CPU on a mid-range phone: **not measured.** The hero band adds up to 51 rotating elements on a wide desktop (18 on a phone), and the cover adds 113 (48 on a phone) until it opens; particles are capped; everything uses transform/opacity only. I'd measure in M6 and drop rosettes if a mid-range phone struggles.
- Screen-reader behaviour (VoiceOver/NVDA): **not tested** beyond axe.
- The tile pattern is **my SVG recreation** in your palette, not your original artwork; please confirm the feel.
- The "IA" monogram is a typographic **placeholder** until you obtain the original file.
- Malay UI strings and the Malay dress-code lines are **my drafts** and need your proofreading ("biru navy" is now per your instruction).
- The RSVP deadline shown (20 Dec 2026) is the temporary placeholder.
- Desktop: the single 42 rem column below the hero is elegant but leaves wide margins; I'd add a two-column details layout and wider tile borders in M6 rather than now. On desktop and tablet the names sit on one line, sized by width and height.
- No music file yet; the music button is UI-only in the prototype.

## 9. Decisions needed from you

Approved by owner: Direction A, tokens, typography, tile pattern, "biru navy" (the Malay dress-code line now reads "dalam warna biru navy"), the navigation, and the Malay UI strings as drafted.

Still to confirm:
1. The cover now has rotating rosettes (§6a). Does it match what you wanted? Should the thin tile dividers and corner medallions also rotate?
2. Hero animation: no objections so far; the optional ideas in §6a remain available.

## 10. Next

On approval: record tokens and patterns in `DESIGN_SYSTEM.md`, delete or archive the prototype, then M2 (foundation: scaffold, Tailwind with these tokens, strict TypeScript, lint/test/CI-ready scripts, security headers, Vercel preview).

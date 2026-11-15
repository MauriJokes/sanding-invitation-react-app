# Design System Brief

**Status:** Direction A ("Navy Gate") **approved by the owner at the end of M1.** Rationale and evidence: `docs/DESIGN_PROPOSAL.md`. Approved Malay/English UI strings: `docs/UI_COPY.md`. Reusable SVG assets: `design-assets/textures/`. Fonts: `design-assets/fonts/`. The throwaway M1 prototype is archived at `design-assets/archive/m1-prototype/` (reference for porting the motion, not shipped).

## 1. Creative direction

Create a premium, elegant, cinematic wedding invitation experience. The design should feel personal and editorial, not like a generic SaaS template.

The owner has previously explored:
- Decorative tile-pattern (azulejo-style) details.
- Gold accents.
- Rich, restrained wedding colours.
- Typography-led layouts.
- Floral and draped/pelamin visual references.
- A refined balance between decorative motifs and whitespace.

Treat these as contextual inspiration, not permission to invent final colour values or artwork. Use the actual moodboard and approved assets when supplied.

## 1a. Reference roles

Owner references live in `design-assets/moodboard/` (see `design-assets/moodboard/NOTES.md`):

- `design-assets/moodboard/theme/` is the source for **theme and decoration**: palette, typography feel, motifs, florals, textures, imagery treatment and mood.
- `design-assets/moodboard/uiux-sample/` is used **only to infer the user journey and overall flow** (screen order, section content, component behaviour). Do not take colours, fonts, imagery or decoration from it.

Apply the `theme/` look to the `uiux-sample/` flow. On appearance `theme/` wins; on flow `uiux-sample/` wins unless `docs/` (for example Sanding-only scope or RSVP rules) requires otherwise.

## 1b. Elements to avoid (owner-approved)

1. Generic template looks: rounded card grids, heavy drop shadows, pill buttons, dashboard-style layout.
2. Tile pattern as a heavy full-bleed background behind text or forms. It must still be clearly present, in the theme palette, as borders, dividers, cover panels and corner ornaments.
3. Metallic or glittery gold gradients, and gold text on busy backgrounds. Use flat antique gold in small amounts.
4. Pure black and pure white. Use deep navy and ivory.
5. Decorative fonts for body text, long script passages, or more than two type families.
6. Clip-art florals, emoji, stock couple photos, and cultural or religious symbols not present in the references.
7. Autoplay audio, scroll hijacking, dizzying parallax and long blocking intros.
8. A cluttered RSVP form: pop-ups, multi-step wizards, or fields beyond name, count and attending/declined.
9. Low-contrast small text (for example gold or burgundy on navy).
10. Lettering from the AI-generated reference photo (palette and mood only).

Exceptions the owner explicitly wants (see §5a): a cover gate/door reveal, subtle ambient motion in corner ornaments, and slow falling particles.

## 1c. Pattern naming

The motif is a **tile pattern** (azulejo-style, blue/gold/ivory), not songket. "Songket Ballroom" is only the venue room name.

## 2. Design process

1. Inspect `design-assets/moodboard/theme/` for theme and decoration, `design-assets/moodboard/uiux-sample/` for journey and flow, plus any logo, typography and colour references.
2. Extract a small set of design principles.
3. Propose two or three coherent visual directions only if materially different options are useful.
4. Recommend one direction and explain the trade-offs briefly.
5. Obtain owner approval before building all pages.
6. Record approved design tokens and component patterns here.

## 3. Approved design tokens

Sampled = measured from `design-assets/moodboard/theme/`; derived = computed from a sampled colour. Do not add colours outside this table without owner approval.

| Token | Hex | Origin | Use |
|---|---|---|---|
| `navy` | `#283368` | sampled | Primary field (hero, countdown, location) |
| `navy-deep` | `#1b2352` | derived (navy ~30% darker) | Nav, gate panels, footer |
| `periwinkle` | `#7e8fb8` | sampled | Tile detail |
| `slate` | `#4b5378` | sampled | Input borders |
| `ivory` | `#e9e1d6` | sampled | Reading surfaces; text on navy |
| `tile-ivory` | `#e7ddd7` | sampled | Tile background (inside the tile asset only) |
| `gold` | `#b8a472` | sampled | Hairlines, tile detail |
| `gold-bright` | `#cfac69` | sampled | Gold text and tassel on navy |
| `gold-ink` | `#645020` | derived (gold darkened) | Gold-toned text on ivory |
| `burgundy` | `#52222a` | sampled | Sparing accent (dress-code swatch, notices) |
| `sage` | `#798776` | sampled | Decoration only, never text |

Verified contrast ratios: ivory on navy 9.19; ivory on navy-deep 11.5; gold-bright on navy 5.53; gold-bright on navy-deep 6.93; navy on ivory 9.19; gold-ink on ivory 5.98; burgundy on ivory 10.0; slate input border on field 6.53. `gold` (#b8a472) on navy is 4.87: use `gold-bright` for text. Sage on ivory is 2.93: decoration only. Never use pure black or white.

**Typography.** Two families only, both SIL OFL and self-hosted (no third-party font requests, to avoid leaking the invite URL via referrer):
- **Allura** (400): couple names and footer sign-off only.
- **Cormorant Garamond** (400/500/600, italic 400/500): everything else. Body 500 at 1.25 rem / line-height 1.5; labels and headings 600, uppercase, letter-spacing .1 to .34 em; helper text italic; lining, tabular numerals for the countdown and count.
- Hero names: `clamp(4.6rem, 22vw, 8.5rem)` on mobile; from 768 px a single line at `clamp(4.5rem, min(10vw, 17vh), 9rem)`.

**Layout.** 4 px spacing base; content column max-width 42 rem; section padding 4.5 rem vertical, 1.5 rem horizontal; breakpoints 360 / 640 / 768 (nav switch) / 1024; touch targets at least 44 px (inputs and buttons 48 px).

**Shape and elevation.** Square corners (2 px radius), 1 px gold hairlines and double-line frames; no drop shadows, no pill buttons, no card grids. Buttons are outlined (gold on navy) or solid navy (on ivory), uppercase, letter-spaced.

**States.** Focus: 2 px outline, `gold-bright` on navy and `navy` on ivory, 3 px offset. Selected controls show a check mark as well as a fill (never colour alone). Notices use a 3 px burgundy left rule. Disabled stepper buttons at 35% opacity.

**Motion tokens.** Gate: 0.9 s, `cubic-bezier(.65,.05,.25,1)`, 0.25 s delay. Entrance: 0.9 s ease-out rise (16 px), 0.16 s stagger, starting 1.05 s after Buka. Corner sway: ±1.5° over 7 s; tassel swing ±6° over 5.2 s. Rosettes: 36 to 84 s per turn, mixed directions. Particles: 14 to 28 s fall, 3 to 6 s drift.

## 3a. Reusable assets

| Asset | File | Notes |
|---|---|---|
| Tile (120 x 120 viewBox, tiled at 84 px) | `design-assets/textures/tile.svg` | Recreated by the agent from the moodboard palette; owner approved the feel |
| Rosette (animated overlay, 72 x 72 viewBox) | `design-assets/textures/rosette.svg` | Same circle as the tile corner; rendered at 50.4 px centred on the 84 px grid points |
| Tassel | `design-assets/textures/tassel.svg` | Uses `currentColor`; gold on navy |
| Medallion | spec only | Quarter circle (radius 196 in a 200 box) filled with the tile, 2 px gold edge plus a thin inner gold arc, navy-deep fallback fill |
| Monogram | typographic placeholder | "I" (gold) beside "A" (ivory) in Cormorant Garamond; replace with the owner's original when supplied |

## 4. Layout principles

- Mobile-first.
- Strong editorial hierarchy.
- Generous but purposeful whitespace.
- Avoid repetitive card grids.
- Use full-bleed or layered imagery only when supplied assets support it.
- Keep RSVP controls clear and easy to operate.
- Make event information scannable.
- Keep decorative elements from obscuring content.

## 5. Motion principles

- Motion should communicate state changes or add atmosphere.
- Respect reduced-motion preferences.
- Keep transitions short and purposeful.
- Avoid scroll hijacking.
- Do not make essential content depend on animation completion.
- Do not autoplay audio.

## 5a. Signature motion (approved)

- **Cover and gate:** a navy plaque (monogram, "Walimatulurus", names, date, **Buka**) over two tile-pattern door panels. The panels carry the same rotating rosettes as the hero band (skip rosettes hidden under the navy wedge). Pressing Buka fades the plaque, then slides the panels apart onto the live page. The cover is then removed from rendering so its animations stop. The cover never gates essential information.
- **Hero:** a full-width tile band (168 px) at the bottom whose rosettes rotate slowly in mixed directions and speeds; after the gate opens, heading, names, date and the scroll cue rise in sequence and the band rises with them. No pattern sits behind text.
- **Corners:** a quarter tile-medallion in each top corner swaying about 1.5 degrees with a tassel swinging like a pendulum (gold thread on navy). Tassels are hidden below 360 px wide.
- **Particles:** gold specks and small tile-derived rosettes drifting down behind content (14 on mobile, 24 on desktop).
- **Still static by design:** the thin tile dividers between sections and the tile inside the medallions.
- **Constraints:** animate `transform` and `opacity` only; pause when the tab is hidden; decoration is `aria-hidden` with `pointer-events: none`; with `prefers-reduced-motion` the gate becomes a short crossfade and the rosettes, corners, tassels and particles stop or switch off; no animation dependency unless CSS cannot do it. Measure on a mid-range phone in M6 and trim rosettes if needed.
- **Accessibility:** Buka is a real button; page content is `inert` until opened; focus moves to the main heading; the site works with animation disabled.
- **Audio:** off by default; opening the cover does not start music. A visible play/pause control only.

## 5b. Navigation (approved)

Below 768 px: fixed bottom bar with four icon-and-label anchors (Butiran, RSVP, Lokasi, Ucapan), a divider, then icon-only BM/EN and music controls. Safe-area padding, current section marked by a gold line as well as colour, hidden while a text field has focus. From 768 px: sticky top bar with the monogram left, anchors centred and controls right.

## 5c. Forms (built in M4)

- The RSVP sits on an ivory reading surface with navy text; the focus outline is navy there (`gold-bright` stays for navy surfaces).
- Inputs have a 1 px `slate` border and a transparent fill (the prototype's lighter field tint was not an approved token, so it was not carried over). An invalid field gets a 2 px `burgundy` border **and** a text message linked with `aria-describedby`; colour is never the only signal.
- Choice buttons (attending / declined) are real radio inputs with a check mark on the selected one. The count is a stepper whose number is shown in lining, tabular numerals: Cormorant's default figures are old-style and make "1" look like a Roman "I".
- Notices and errors use the 3 px `burgundy` left rule; one `role="alert"` region announces submit errors.
- The guestbook uses the same fields on the ivory surface, plus a 24 px checkbox with a 48 px tap row, a text-only character counter (lining numerals) and a list of wishes: plain text, a gold hairline between entries, the name in small gold-ink capitals. Hidden spam-trap field: positioned off-screen, `aria-hidden`, `tabindex=-1`.
- All controls are at least 48 px tall. The submit button shows "Menghantar…" and is disabled while a request is pending.

## 5d. Cover plaque

The cover follows §5a. The plaque is deep navy (`navy-deep`) with gold and ivory text and gold hairlines (D-31; contrast 6.9:1 and 11.5:1). A botanical variant using the owner's flower and leaf art is parked in `BACKLOG.md` (B-1) and is not part of the current design.

## 6. Accessibility

- Semantic HTML.
- Keyboard-operable controls.
- Visible focus indicators.
- Sufficient contrast.
- Form labels and actionable validation messages.
- Accessible names for icon-only controls.
- Reduced-motion support.
- Do not communicate state using colour alone.

## 7. Component consistency

Create shared components only where repeated patterns justify them. Avoid building a large design-system abstraction layer for a small website.

## 8. Approval gate

Met for the M1 direction (see `DESIGN_PROPOSAL.md`). New sections, new colours or new motion beyond this document need owner approval before they are built.

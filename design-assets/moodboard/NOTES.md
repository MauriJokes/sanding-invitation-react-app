# Moodboard Notes

The two reference folders have different roles. Do not mix them.

## `theme/` — visual source of truth

Use for **theme and decoration**: colour palette, typography feel, tile-pattern motifs, florals, gold accents, textures, imagery treatment and overall mood.

- `sanding-invite.png` — the invitation artwork.
- `photo_2026-11-14 00.14.37.jpeg` — additional reference photo.

Derive design tokens and decorative styling from these files only.

## `uiux-sample/` — user journey and flow reference only

Use for **user journey and overall flow**: which screens exist, their order, how a guest moves between them, and what each section contains and does.

- `hero-screen.png`, `invitation-screen.png`, `main-screen.png` — screen sequence and content structure.
- `countdown-component.png`, `guestbook-component.png` — component behaviour and placement.

Do **not** copy colours, fonts, imagery, decoration or exact styling from these samples. Apply the `theme/` styling to the flow and structure they show. Where the two conflict, `theme/` wins on appearance and `uiux-sample/` wins on flow.

## Notes

- Elements to avoid: see `docs/DESIGN_SYSTEM.md` §1b (owner-approved list).
- Favourite references: `design-assets/moodboard/theme/sanding-invite.png` 
- Flow deviations from `uiux-sample/` required by `docs/` (for example Sanding-only scope and the RSVP rules) are intentional; `docs/` takes precedence over the samples.

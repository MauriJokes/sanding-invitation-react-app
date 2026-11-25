# Backlog

Ideas that are wanted but **not in scope** for the current milestones. Nothing here is built until the owner moves it into a milestone.

## B-1 — Botanical cover (approved)

The owner approved a botanical cover and supplied revised mobile and desktop references. It is implemented as described in `DESIGN_SYSTEM.md` §5a and §5d. The earlier deferred proposal below is historical and does not override the approved design.

Deferred by the owner on 2026-11-15 in favour of the approved M1 cover (gate, rosettes, medallion corners, tassels, particles).

**Request:** use the supplied botanical art around the cover's square and diamond shapes, as in `design-assets/moodboard/theme/photo_2026-11-15 02.32.41.jpeg`, with subtle motion (leaves swaying side to side, petals moving, not overwhelming).

**Source art** (`design-assets/textures/`, git-ignored, about 68 MB): `blue-flower`, `white-flower` (only 362 px wide), `branch-1`, `branch-2`, `fern`, `golden-leaf-1/2/3`. All are bitmaps wrapped in SVG, so they need a local pipeline to transparent WebP before use (target at most 600 KB for the cover). Rendered placement mock: `design-assets/archive/m6-placement-mock.jpg`.

**Decisions already taken for this idea (carry over if revived):**

- Plaque stays deep navy with gold/ivory text (D-31, also valid for the approved cover).
- Corners are composed from the supplied assets only; no roses (D-32).
- Source SVGs stay out of git; only small optimised outputs are committed (D-33).
- Motion defaults (D-34): leaves sway 1.5 to 3 degrees over 6 to 11 s, desynchronised; flowers breathe about 1.5 degrees and 1% scale; 6 to 8 drifting petals; transform and opacity only; static under reduced motion; stopped once the cover is removed.

**Layout rules from the mock:** each cluster belongs to one door half and never crosses the centre seam; text and **Buka** stay uncovered; clusters take at most about a third of the width on a phone.

**Open inputs if revived:** a higher-resolution white blossom; whether the hero should also get botanicals.

**Revisit after:** M6 approval, so the cover can be reviewed on its own.

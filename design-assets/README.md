# Design Assets and Moodboard

## Where to put your moodboard

The moodboard lives in `design-assets/moodboard/`. `design-assets/moodboard/theme/` is the source for theme and decoration; `design-assets/moodboard/uiux-sample/` is only for the user journey and overall flow. See `design-assets/moodboard/NOTES.md`. The notes below are the original template guidance.

Add the moodboard you already created to this folder:

- `design-assets/moodboard/wedding-moodboard.pdf` for a PDF export, or
- `design-assets/moodboard/` with the original JPG/PNG images if you prefer individual references.

You can also add a short note called `design-assets/moodboard/NOTES.md` describing what to borrow from each reference (palette, typography, floral styling, layout, textures, motion, etc.).

## Asset folders

- `design-assets/moodboard/`: full moodboard and reference screenshots (`theme/` and `uiux-sample/`).
- `textures/`: approved tile, rosette and tassel SVGs (see `docs/DESIGN_SYSTEM.md` §3a), plus the owner's botanical source art (`blue-flower`, `white-flower`, `branch-1/2`, `fern`, `golden-leaf-1/2/3`). The botanical files are bitmaps wrapped in SVG, about 68 MB in total, so they are **git-ignored**: keep them on your machine and back them up elsewhere. Only the optimised WebP versions generated from them (in `src/assets/botanicals/`) are committed. Never add large source files to git: history keeps them forever and every clone and build downloads them.
- `fonts/`: self-hosted Allura and Cormorant Garamond (SIL OFL).
- `archive/m1-prototype/`: throwaway M1 prototype (reference only, not shipped).
- `florals/`: approved floral artwork or photographs.
- `logos/`: couple monogram, Bismillah artwork, wordmarks.
- `audio/`: the single supplied/licensed music track.

Only put assets here that you own or have permission to use. Keep original high-resolution files; the coding agent should create optimised web versions in the application asset pipeline rather than overwriting originals.

## How to use it with the coding agent

After adding the files, ask the agent to read `docs/DESIGN_SYSTEM.md` and inspect every file in `design-assets/moodboard/` (applying the roles in `design-assets/moodboard/NOTES.md`). It should summarise the visual direction and propose a token palette, typography pairing, layout language, imagery treatment, and motion principles. Approve that proposal before full implementation.

---
name: wedding-ui-design
description: >
  Use when designing or implementing visual layouts, typography, design tokens, responsive behaviour, invitation presentation, navigation, motion, or accessibility for the wedding website.
---

# Wedding UI Design Skill

## Objective
Create a premium, elegant, cinematic wedding experience grounded in the owner's supplied references.

## Read first
- `docs/DESIGN_SYSTEM.md`
- `docs/PROJECT_BRIEF.md`
- Relevant feature specification.
- `design-assets/moodboard/NOTES.md`: `design-assets/moodboard/theme/` is the source for theme and decoration; `design-assets/moodboard/uiux-sample/` is only for user journey and overall flow (never for colours, fonts, imagery or decoration).
- Supplied invitation artwork, logo, photos and font references.

## Design principles
- Mobile-first.
- Editorial hierarchy and deliberate whitespace.
- Restrained decorative details.
- Strong, readable typography.
- Consistent tokens and interaction states.
- Avoid generic SaaS patterns and repetitive card grids.
- Never invent wedding copy, logos, colour values or venue details.

## Required process
1. Inspect all supplied references, respecting their roles: theme and decoration from `design-assets/moodboard/theme/`; journey and flow from `design-assets/moodboard/uiux-sample/`.
2. Identify recurring visual traits and constraints.
3. Propose a coherent direction and a concise rationale.
4. Identify missing assets and owner decisions.
5. Obtain approval before implementing the full design system.
6. Define reusable tokens and only the components needed.
7. Implement one representative section and verify responsive behaviour.
8. Extend the approved system to other sections.

## Responsive requirements
- Design from small screens upward.
- Check narrow mobile widths, larger phones, tablet and desktop.
- Prevent horizontal overflow.
- Keep tap targets comfortable.
- Avoid fixed heights that clip translated or dynamic content.

## Accessibility
- Semantic HTML.
- Keyboard-operable controls.
- Visible focus.
- Labelled inputs.
- Accessible error messaging.
- Sufficient contrast.
- Reduced-motion support.
- Do not communicate state through colour alone.

## Motion and audio
- Motion should communicate state or atmosphere.
- Respect `prefers-reduced-motion`.
- No scroll hijacking.
- No essential information hidden behind an animation.
- Never force audio autoplay; provide explicit controls.

## Quality gate
Before marking a design task complete, check mobile/desktop layouts, keyboard interaction, focus states, reduced motion, text overflow and loading/error states.

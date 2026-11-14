# Project-wide Copilot Instructions

Read `docs/PROJECT_BRIEF.md` first. For task-specific work, consult only the relevant documents in `docs/` and activate the matching Agent Skill under `.github/skills/`.

## Engineering rules

- Follow the approved React + Vite + TypeScript, Tailwind, Vercel Functions and MongoDB Atlas architecture.
- Keep browser code in `src/`; keep API entry points in `api/`; keep server-only logic in `server/`.
- Never import server-only modules into browser code.
- MongoDB is authoritative; Google Sheets is a one-way reporting mirror.
- Do not create a conventional always-on backend server or an admin dashboard unless the owner changes scope.
- Use strict TypeScript and validate external input with Zod.
- Keep API handlers thin and business rules in server-side services.
- Enforce invitation-group membership, event eligibility and RSVP deadlines server-side.
- Never expose secrets, guest lists or other groups' RSVP data.
- Reuse MongoDB connections and use indexes based on actual query patterns.
- Prefer the smallest maintainable implementation that meets the acceptance criteria.
- Reuse existing components and patterns; do not duplicate functionality.
- Do not add dependencies, abstractions, collections or endpoints without a concrete requirement.
- Respect accessibility, responsive behaviour and reduced-motion preferences.
- Do not autoplay audio or make essential content depend on animation.

## Working method

1. Inspect the relevant existing files before editing.
2. Read the applicable specification and skill references.
3. Identify assumptions that materially affect security, data integrity or user experience.
4. Ask for clarification when a blocking business decision is unresolved.
5. Plan the smallest coherent change.
6. Implement and run targeted checks.
7. Run broader checks when changes affect shared architecture or critical journeys.
8. Report changed files, verification results and remaining issues concisely.

## Token and context efficiency

- Do not reread or restate the entire project specification for every task.
- Load only relevant skill references.
- Do not print entire files unless requested or needed to diagnose an issue.
- Avoid generating duplicate documentation.
- Do not produce multiple alternatives unless the decision genuinely requires comparison.
- Do not narrate hidden reasoning. Provide concise decisions and verifiable outcomes.
- Never skip security, data-integrity or test requirements merely to reduce token use.

## Source of truth

If documents conflict, follow this order:
1. Latest explicit owner decision.
2. `docs/OPEN_DECISIONS.md` once a decision is approved and updated.
3. Relevant feature specification.
4. Architecture and data-model documents.
5. General conventions in this file.

Update the relevant documentation when an approved requirement changes.

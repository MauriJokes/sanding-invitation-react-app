---
name: project-architecture
description: >
  Use when planning or changing repository structure, application boundaries, dependencies, configuration, deployment architecture, or cross-cutting engineering conventions.
---

# Project Architecture Skill

## Objective
Keep the wedding application small, coherent, secure and maintainable. Follow the approved project architecture rather than introducing a new architecture for each feature.

## Read first
- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/OPEN_DECISIONS.md`
- Relevant feature and security specifications.

## Boundaries
- `src/`: browser-only React application.
- `api/`: Vercel Function entry points.
- `server/`: server-only services, repositories, database and secrets-aware utilities.
- `docs/`: source-of-truth requirements.
- `.github/skills/`: task-specific agent procedures.

Never import server-only modules into browser code. Keep API handlers thin and domain rules in server-side services.

## Procedure
1. Inspect the current repository and package scripts.
2. Identify the smallest set of files and modules affected.
3. Check whether an existing utility or component already solves the problem.
4. Confirm that the proposed change respects the trust boundaries.
5. Check whether a new dependency, collection, endpoint or abstraction is genuinely necessary.
6. Implement only the approved change.
7. Update architecture documentation only when an approved decision changes.
8. Run relevant build, type and test checks.

## Dependency policy
Prefer native platform capabilities and existing dependencies. Do not add state libraries, ORM layers, backend frameworks, queue infrastructure or component libraries without a specific demonstrated need.

## Decision policy
- Do not silently resolve material product decisions.
- For unresolved security or data-integrity decisions, stop and ask.
- For minor implementation details, choose the simplest conventional option and document it briefly.
- Do not create empty directories or speculative modules just to match a diagram.

## Completion report
State changed files, important design decisions, verification commands/results and unresolved blockers. Keep it concise.

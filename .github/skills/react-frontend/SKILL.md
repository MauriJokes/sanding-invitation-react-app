---
name: react-frontend
description: >
  Use when implementing React components, hooks, routes, client-side state, forms, API integration, TypeScript types, or browser performance.
---

# React Frontend Skill

## Objective
Implement a lean, typed and accessible React frontend.

## Read first
- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SYSTEM.md`
- Relevant feature and API contracts.

## Rules
- Use React + Vite + TypeScript.
- Keep strict TypeScript settings; avoid `any`.
- Browser code belongs in `src/`.
- Never import from `server/`.
- Treat all API responses as untrusted until validated/handled.
- Keep business rules on the server; UI checks are for usability, not security.
- Use local component state unless shared state is demonstrably needed.
- Avoid unnecessary global state libraries.
- Use semantic HTML and accessible form controls.
- Keep components focused; do not create abstractions for one-off markup without benefit.

## Implementation procedure
1. Inspect existing components, routes, hooks and styles.
2. Identify the feature boundary and API contract.
3. Define or reuse types.
4. Implement loading, success, empty and error states.
5. Prevent duplicate form submissions while a request is pending.
6. Handle network failures without losing user-entered data where practical.
7. Add focused component or integration tests.
8. Verify keyboard and responsive behaviour.

## API usage
- Use a central, small API client only if it avoids repeated transport boilerplate.
- Do not put credentials in frontend requests or environment variables.
- Do not assume a successful request merely because the UI submitted it.
- Handle expected status codes explicitly.
- Avoid logging private guest data.

## Performance
- Avoid unnecessary dependencies and large assets.
- Lazy-load non-critical sections/assets where useful.
- Avoid excessive re-renders and continuously running animations.
- Keep the initial invitation experience fast.

## Completion
Report components changed, API contracts used, tests run and any known limitations.

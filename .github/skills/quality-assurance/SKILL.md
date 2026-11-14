---
name: quality-assurance
description: >
  Use when planning or executing unit, integration, end-to-end, accessibility, responsive, security, performance, or production-readiness checks.
---

# Quality Assurance Skill

## Objective
Verify that the implemented application satisfies its specifications and does not compromise privacy, data integrity or usability.

## Read first
- `docs/ACCEPTANCE_CRITERIA.md`
- Relevant feature specifications.
- `docs/SECURITY_REQUIREMENTS.md`
- `docs/API_CONTRACTS.md`

## Test strategy
Use the smallest useful test at each layer:
- Unit tests for pure business rules and validation.
- Integration tests for repositories, API handlers and Sheets write-through behaviour.
- Playwright for critical browser journeys.
- Manual responsive/accessibility review for visual behaviour.

## Critical journeys
1. Visitor opens the invitation.
2. External guest submits an RSVP (max 2) and sees confirmation.
3. Internal guest opens `?invite=<code>`, URL is stripped, submits an RSVP (max 10).
4. Duplicate family/group submission is rejected neutrally.
5. Declined RSVP is stored with 0 attendees.
6. Sheets receives each submission once.
7. Guest submits a named guestbook message and sees it.
8. Guest submits an anonymous message; it is not shown.

## Security tests
- Wrong/rotated invite yields the external limit with no validity leak.
- Client-supplied limit or `guestType` is ignored.
- Anonymous guestbook entries never appear in public responses.
- RSVP deadline is enforced server-side.
- Secrets are absent from client bundle and logs.
- Guestbook content is safely rendered.
- Formula-like input stays as text in Sheets.
- Rate limits work.

## Responsive and accessibility checks
- Mobile, tablet and desktop widths.
- Keyboard-only navigation.
- Visible focus.
- Labels and error associations.
- Colour contrast.
- Reduced-motion behaviour.
- No horizontal overflow.
- Audio controls are accessible and optional.

## Reporting discipline
Never claim a test passed unless it was executed. Separate:
- Passed checks.
- Failed checks.
- Not run.
- Known limitations.
- Owner decisions still required.

Do not automatically deploy to production without owner approval.

---
name: rsvp-management
description: >
  Use when implementing the public Sanding family/group RSVP form, duplicate protection, attendee-count validation, RSVP deadlines, or RSVP-related data integrity.
---

# RSVP Management Skill

## Objective
Implement a public, non-personalised invitation and RSVP flow for the Sanding celebration only. One representative submits one response for the whole family/group.

## Read first
- `docs/FEATURE_SPECIFICATIONS.md`
- `docs/DATA_MODEL.md`
- `docs/API_CONTRACTS.md`
- `docs/OPEN_DECISIONS.md`
- `docs/SECURITY_REQUIREMENTS.md`
- `docs/WEDDING_CONTENT.md`
- `.github/skills/rsvp-management/references/rsvp-business-rules.md`

## Core model
- One RSVP document represents one family/group submission for Sanding.
- Capture the family/group name, RSVP status, derived guest type and one total attendee count.
- Do not collect separate attendance counts for other wedding events.
- There are no individual guest records, invitation tokens, group lookups, or guest accounts in this RSVP flow.

## Guest types
- External guests use the clean link (max 2 pax). Internal guests use `?invite=<shared code>` (max 10 pax).
- Client: read `invite`, save it in `localStorage` (internal guests only), strip it from the URL with `history.replaceState`, reuse it on later visits, clear it if rejected. Fetch the limit from `POST /api/rsvp/config`.
- The server compares `invite` with `INTERNAL_INVITE_CODE` in constant time and derives `guestType`. Never accept a client-sent `guestType` or limit, and never fail open to `internal`. A wrong invite behaves like a missing one.
- Store the derived `guestType` on the RSVP (never the code). It does not change duplicate uniqueness.
- The code is a soft control, not authentication; rotate `INTERNAL_INVITE_CODE` if it leaks. Never log query strings.

## Access
- The invitation website and RSVP form are public.
- Do not implement personalised links, per-guest invitation codes, login, or private group access. The single shared `invite` code is the only allowed link differentiation.
- Never expose the RSVP collection or another family's response to public visitors.

## Submission rules
1. Validate and normalise the family/group name on the server.
2. Derive `guestType` from the invite; validate RSVP status and attendee count against that guest type's bound (internal 10, external 2).
3. Enforce the approved RSVP deadline using the venue timezone.
4. Insert a new record only; never update or overwrite an existing submission.
5. Enforce uniqueness with a database index on the canonical family/group key.
6. Handle concurrent duplicate-key errors safely and return a neutral duplicate message.
7. Do not reveal the existing attendee count or other stored details.
8. Mark reporting sync pending after MongoDB persistence.
9. Return confirmation only after the write succeeds.

## Duplicate caveat
A public form cannot reliably identify a household if the name is entered differently. Canonicalise Unicode, case and whitespace. Give clear instructions to use a consistent family/group name. Do not add phone/email collection without explicit approval.

## Do not implement
- RSVP editing or update endpoints.
- Public RSVP lookup/list endpoints.
- Individual guest-by-guest response forms.
- Invitation tokens or guest login.
- RSVP options or attendee counts for other wedding events.
- Unapproved plus-one rules or extra personal fields.

## Required tests
- Valid family/group submission for Sanding.
- Invalid or empty family/group name.
- Attendee count below/above allowed bounds for each guest type (internal 10, external 2).
- Missing, wrong or rotated invite defaults to the external limit without revealing validity.
- External count of 3 is rejected; internal count of 10 is accepted.
- Derived `guestType` is stored and mirrored to Sheets; the invite code is not.
- `localStorage` persistence, URL stripping, and clearing of a rejected stored invite.
- `POST /api/rsvp/config` returns 10 for a valid invite and 2 otherwise, with identical response shape.
- Duplicate canonical family/group submission.
- Concurrent duplicate submissions.
- Submission after deadline.
- Request retry after successful write.
- No public RSVP read/list endpoint.
- Sheets unavailable after MongoDB write.
- Confirm the form and confirmation wording specify Sanding only.

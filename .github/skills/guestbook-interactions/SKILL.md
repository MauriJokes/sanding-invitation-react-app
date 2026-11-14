---
name: guestbook-interactions
description: >
  Use when implementing the public guestbook submission form, immediate message publication, message retrieval, pagination, validation, abuse controls, or safe rendering.
---

# Guestbook Interactions Skill

## Objective
Implement a simple guestbook: named messages are published immediately; anonymous messages are saved for the couple only.

## Read first
- `docs/FEATURE_SPECIFICATIONS.md`
- `docs/API_CONTRACTS.md`
- `docs/SECURITY_REQUIREMENTS.md`

## Requirements
- Immediate publication of named messages is the confirmed behaviour.
- Display name is optional; provide a "Send anonymously" checkbox. A blank name means anonymous.
- Anonymous entries (`isPublic: false`) are stored and mirrored to the `Guestbook` worksheet but never returned by any public endpoint. The confirmation text must say they are private.
- Enforce server-side length limits.
- Rate-limit submissions (MongoDB TTL collection, hashed IP).
- Apply a honeypot field as a basic spam control.
- Store and return plain text.
- Render user content as text, never as trusted HTML.
- Return bounded, cursor-paginated results (newest first).
- Keep public response fields minimal.
- Provide loading, success, empty and error UI states.

## Do not add
- Manual moderation workflow.
- Admin dashboard.
- Rich HTML editor.
- Public deletion controls.
- Unapproved personal data fields.

## Abuse and privacy
Immediate publication does not mean unrestricted input. Reject empty, oversized or malformed messages. Avoid logging message content unnecessarily. Document how the owner can remove an inappropriate entry through a controlled administrative process.

## Tests
- Valid submission.
- Empty name/message.
- Overlong fields.
- HTML/script-like text displayed harmlessly.
- Rate limit exceeded.
- Pagination boundaries.
- Public response excludes internal fields.
- Anonymous entry is stored and mirrored but absent from `GET /api/guestbook`.
- Sheets failure leaves `pending` and still returns success.

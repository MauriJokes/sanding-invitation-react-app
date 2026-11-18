# Security and Privacy Requirements

## 1. Data classification

### Public
- Approved couple/invitation content.
- Public event details.
- Published guestbook display name and message.

### Private
- RSVP records.
- Anonymous guestbook entries and any name attached to them.
- Rate-limit records (hashed IPs only).

### Secret
- MongoDB connection string.
- Google service-account credentials.
- `INTERNAL_INVITE_CODE` and `RATE_LIMIT_SALT`.
- Any other provider credentials.

## 2. Mandatory controls

- Keep all secrets in server-side environment variables.
- Never prefix secrets with Vite's public `VITE_` variable convention.
- Never bundle server modules into browser code.
- Do not expose guest lists through public endpoints.
- Enforce family/group duplicate checks, guest-type attendee-count bounds (internal 10, external 2), and RSVP deadlines on the server. Verify the shared `invite` code server-side in constant time, default to the stricter external limit, keep `INTERNAL_INVITE_CODE` in server-only environment variables, never log query strings, and set `Referrer-Policy: no-referrer`.
- Rate-limit public RSVP and guestbook writes and the config endpoint using the MongoDB TTL collection with salted-SHA-256 hashed IPs; never store or log raw IPs.
- Write to Sheets with `valueInputOption: RAW` to prevent formula injection.
- Never return anonymous guestbook entries from any public endpoint.
- Self-host fonts and assets so the invite URL is not leaked via referrers.
- Apply request body and field length limits.
- Use safe response schemas and avoid over-fetching.
- Escape/render guestbook messages as plain text.
- Keep logs free of tokens, secrets and unnecessary personal information.
- Use least-privilege access for Google service account and MongoDB credentials.
- Restrict spreadsheet sharing.
- Do not commit `.env` files or service-account JSON.

## 3. Guestbook abuse controls

Immediate publication is a product requirement. It does not remove the need for basic protections.

Implement:
- Maximum display-name and message lengths.
- Server-side rate limiting.
- Basic spam controls (honeypot field).
- Plain-text rendering.
- A documented owner removal procedure.
- Bounded pagination.

Do not add manual moderation unless the owner changes the requirement.

## 4. Operational security

- Use separate development and production credentials.
- Review MongoDB Atlas network access.
- Configure Vercel environment variables per environment.
- Rotate credentials if accidentally exposed.
- Restrict access to production logs and spreadsheets.
- Verify security behaviour in integration tests.

## 5. Privacy by design

Collect only data necessary for invitation and attendance management. Do not add email addresses, dietary requirements, accessibility information or other personal data without an explicit requirement and retention decision.

**Phone number (owner decision, 2026-11-16, D-36):** the RSVP collects one contact phone number per family/group so the couple can reach the guest. Controls:
- It is stored only on the RSVP document and mirrored to the `Family RSVP` sheet; it is never returned by any API (the RSVP confirmation echoes back only what the same guest just typed, in their own browser).
- It is validated and normalised to E.164 on the server, and only Brunei (+673) and Malaysian (+60) numbers are accepted; the client's formatting is never trusted.
- It is never logged, never part of the duplicate key, and never sent to the Sheets mirror in any worksheet other than `Family RSVP`.
- The spreadsheet is shared only with the service account and the couple.
- Retention: the owner keeps the numbers for as long as they wish (D-36); there is no automatic deletion. The couple can remove a family's RSVP, phone number included, as described in `OPERATIONS.md`.

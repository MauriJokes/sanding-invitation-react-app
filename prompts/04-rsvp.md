# Milestone 3 — Public Sanding Family RSVP

Activate `rsvp-management`, `mongodb-data`, `vercel-serverless` and `quality-assurance`.

Implement the public, non-personalised family/group RSVP flow for the **Sanding celebration only**, as described in `docs/WEDDING_CONTENT.md` and the RSVP business rules.

Requirements:
- The website is exclusively for Sanding. Do not include other wedding events as RSVP options.
- No guest login, personalised invitation link, per-guest token, or group lookup. The only link differentiation is one shared `invite` code (`?invite=<code>`), verified server-side against `INTERNAL_INVITE_CODE`. The clean link is external.
- One representative submits the family/group name and one total attendee count for Sanding.
- Do not collect separate attendance counts for multiple events.
- Enforce the attendee-count limit server-side from the verified invite (valid = internal 10; otherwise external 2) and the RSVP deadline.
- Client: read `invite`, store it in `localStorage` (internal only), strip it from the URL, reuse it on later visits, clear it if rejected. Call `POST /api/rsvp/config` to show the correct maximum. Send `invite` with the RSVP; never send `guestType`. The server stores the derived `guestType`.
- Canonicalise the family/group name and enforce uniqueness in MongoDB.
- Insert only; do not support editing, updates, or public RSVP lookup/listing.
- Reject duplicate submissions without exposing the existing record.
- Handle retries and concurrent duplicate submissions safely.
- Mirror successful MongoDB records to Google Sheets asynchronously/idempotently.
- Make the form and confirmation explicitly state that the RSVP is for Sanding only.

Add tests for valid, invalid, duplicate, concurrent, over-capacity (clean link, valid invite, wrong/rotated invite) and post-deadline submissions.

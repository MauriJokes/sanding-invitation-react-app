# Acceptance Criteria and Definition of Done

## 1. Build and engineering checks

- [ ] Production build succeeds.
- [ ] TypeScript type-check succeeds.
- [ ] Lint succeeds.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Critical Playwright journeys pass.
- [ ] No secrets are present in client bundles or repository history.
- [ ] No browser module imports server-only code.

## 2. Invitation

- [ ] Landing page renders on mobile and desktop.
- [ ] Invitation reveal works with keyboard and touch.
- [ ] Essential information is accessible without sound.
- [ ] Reduced-motion preference is respected.
- [ ] Approved copy and assets are used.

## 3. RSVP

- [ ] The clean link allows up to 2 attendees; `?invite=<valid code>` allows up to 10.
- [ ] A wrong or rotated invite applies the external (2 pax) limit and does not reveal that it was invalid.
- [ ] The server rejects over-limit counts based on the verified invite, regardless of UI or `localStorage` state.
- [ ] The invite is saved in `localStorage` for internal guests, removed from the address bar, and reused on later visits.
- [ ] The derived `guestType` is stored with the RSVP and appears in the Google Sheet; the invite code never does.

- [ ] `attending` requires 1 to the maximum for the verified guest type; `declined` requires 0.
- [ ] Declined responses are stored explicitly.
- [ ] A duplicate canonical family/group is rejected with a neutral message and the original is unchanged.
- [ ] There is no public edit/update route and no RSVP list or lookup.
- [ ] A closed RSVP deadline is enforced server-side.
- [ ] Concurrent/retried submissions do not create duplicates or corrupt data.
- [ ] RSVP is rate-limited.

## 4. Guestbook

- [ ] A valid named message is stored and immediately visible.
- [ ] An anonymous message (blank name or box ticked) is stored and mirrored but never returned by the public API.
- [ ] Message length limits are enforced.
- [ ] Rate limiting works.
- [ ] User content is rendered as plain text.
- [ ] Public API returns bounded `displayName`, `message`, `createdAt` of public entries only.
- [ ] Empty and error states are usable.

## 5. Google Sheets

- [ ] Service-account access is limited to the intended spreadsheet.
- [ ] Successful MongoDB writes do not depend on Sheets availability.
- [ ] Each RSVP and guestbook entry appears once in `Family RSVP` / `Guestbook`.
- [ ] Values starting with `=`, `+`, `-` or `@` are not interpreted as formulas.
- [ ] A failed append leaves `sheetStatus: "pending"`.
- [ ] `scripts/backfill-sheets.ts` appends pending rows, skips existing IDs and is idempotent.
- [ ] No secrets, invite code or IP data appear in the sheet.

## 6. Experience and accessibility

- [ ] Layout works at common mobile, tablet and desktop widths.
- [ ] Navigation and forms are keyboard-operable.
- [ ] Focus states are visible.
- [ ] Form errors are understandable and associated with inputs.
- [ ] Contrast is adequate.
- [ ] Reduced motion is respected.
- [ ] Audio does not autoplay unexpectedly.
- [ ] Audio failure does not block the site.

## 7. Deployment

- [ ] Production environment variables are configured.
- [ ] MongoDB Atlas access is configured.
- [ ] `npm run db:indexes` has been run on every database that takes RSVPs, and the unique `canonicalGroupKey` index is present (without it duplicates are accepted).
- [ ] Google API integration is configured and a test append succeeds.
- [ ] Rate-limit TTL index exists in production.
- [ ] No cron jobs are configured.
- [ ] Production deployment succeeds.
- [ ] A production smoke test is completed.
- [ ] Operational recovery steps are documented.

## 8. Completion report

At the end of each milestone, report:
1. What changed.
2. Files created or modified.
3. Tests/checks executed and their results.
4. Known limitations.
5. Decisions still requiring owner input.

Do not claim completion for checks that were not actually run.

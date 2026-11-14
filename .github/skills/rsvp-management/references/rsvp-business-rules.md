# RSVP Business Rules

1. The website and RSVP form are public and non-personalised. External guests use the clean link; internal guests use the same link with one shared `?invite=<code>`. The code is verified server-side and is not per-guest personalisation or authentication.
2. This website is exclusively an invitation to the **Sanding celebration**. Do not show the other wedding events as RSVP choices or collect attendance for them.
3. One representative submits one RSVP for the whole family/group attending Sanding.
4. Collect one total attendee count for that family/group. Do not collect per-event counts. `attending` is 1 to max; `declined` is 0.
   - Valid invite (`internal`): maximum 10 pax.
   - No, wrong or rotated invite (`external`): maximum 2 pax.
   - A wrong invite is indistinguishable from a missing one in responses.
   - The server enforces the limit from the verified invite; the UI limit is a convenience.
   - The derived `guestType` is stored on the RSVP; the code is never stored.
5. An absent RSVP means no response has been recorded; it does not mean declined.
6. `attending` and `declined` are explicit states if decline is enabled.
7. The deadline is evaluated server-side using the configured venue timezone and an unambiguous instant.
8. Only one accepted submission is allowed per canonical family/group.
9. The first accepted submission is final; the public form cannot edit or replace it.
10. Duplicate submissions must not reveal the existing RSVP details.
11. Spreadsheet sync is downstream and cannot invalidate a committed RSVP.

## Duplicate detection limitation

Because the website is public and non-personalised, the system cannot prove that two differently written family names refer to the same household. Canonicalise Unicode, case and whitespace, and clearly instruct each family to use one consistent family/group name. Do not add phone/email collection or identity verification without explicit approval.

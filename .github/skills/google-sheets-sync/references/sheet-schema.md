# Sheet Schema

**Worksheet `Family RSVP`**

| Column | Source |
|---|---|
| RSVP ID | MongoDB `_id` |
| Submitted At | `createdAt` |
| Family / Group Name | `familyGroupName` |
| Guest Type | `internal` / `external` |
| RSVP Status | `attending` / `declined` |
| Attendee Count | `attendeeCount` |

**Worksheet `Guestbook`**

| Column | Source |
|---|---|
| Entry ID | MongoDB `_id` |
| Submitted At | `createdAt` |
| Name | `displayName` (blank if none) |
| Visibility | `public` / `anonymous` |
| Message | `message` |

One row per submission, keyed by the stable MongoDB `_id`. Never include the invite code, IP data, secrets or unnecessary personal data.

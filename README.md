# Adam & Izyan Wedding Invitation — Project & Agent Skills Package

**Package version:** 1.0.0  
**Purpose:** Repository-ready project documentation and GitHub Copilot Agent Skills for the wedding invitation website.

This package gives an AI coding agent the product requirements, architecture boundaries, feature rules, quality standards, and task-specific skills needed to implement the application consistently.

## Package contents

- `docs/`: product, design, architecture, data, API, security, feature, and acceptance specifications.
- `.github/copilot-instructions.md`: concise project-wide coding instructions.
- `.github/skills/`: nine specialised Agent Skills, each with supporting references.
- `prompts/`: implementation kickoff and milestone prompts.
- `.env.example`: names of expected server-side environment variables (no secrets).
- `vercel.json`: security headers, CSP and asset caching (no cron on Hobby).
- `docs/OPERATIONS.md`: commands, the pending-rows procedure and how to remove a guestbook entry.

## Install into a repository

1. Create or open the wedding website repository.
2. Copy the contents of this package into the repository root, preserving hidden `.github` paths.
3. Review `docs/OPEN_DECISIONS.md` and resolve decisions marked **Approval required**.
4. Add references under `design-assets/moodboard/`: `theme/` for theme and decoration, `uiux-sample/` for user journey and flow only (see `design-assets/moodboard/NOTES.md`). Add final event details and RSVP deadline to `docs/WEDDING_CONTENT.md`.
5. Configure environment variables in Vercel and local development.
6. Ask Copilot to inspect the repository and documentation using `prompts/00-discovery-and-plan.md`.
7. Approve the plan before asking it to implement milestones.

## Important

This package is a specification and skills package, not a completed application. It intentionally does not contain application source code, live credentials, real guest data, or a populated Google Sheet.

The website and RSVP form are public and non-personalised. RSVP is one insert-only submission per family/group, with one representative entering the total attendee count. There are no guest logins, personalised invitation links, or RSVP edit/update flows. External guests use the clean link (max 2 pax). Internal guests use the link with `?invite=<shared code>` (max 10 pax); the code is verified server-side.

The Google Sheets integration is one-way write-through (no cron on Vercel Hobby): MongoDB is authoritative and Sheets is a reporting mirror. Do not allow spreadsheet edits to silently overwrite MongoDB.

## Suggested first steps

- Fill in `docs/WEDDING_CONTENT.md` with the approved event details, dates, venue timezone, and RSVP deadline. Attendee maximums are set (internal 10, external 2); the RSVP is overall for Sanding only.
- Create a private Google service account and share only the designated spreadsheet with it.
- Confirm the MongoDB Atlas database and network access configuration.
- Confirm the Vercel plan supports the intended scheduled function frequency and execution duration.
- Add approved visual references and final wedding copy.
# sanding-invitation-react-app
# sanding-invitation-react-app

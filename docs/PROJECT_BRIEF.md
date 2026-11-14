# Project Brief

**Project:** Adam & Izyan Wedding Invitation Website  
**Version:** 1.0.0  
**Status:** Initial approved scope; unresolved decisions are tracked separately.

## 1. Product vision

Build a premium, elegant, interactive digital wedding invitation and guest experience for Adam and Izyan. The website is the public source of wedding information and the guest-facing interface for the Sanding RSVP and wedding wishes.

The experience should feel intentional and personal rather than like a generic event-management product. It should be mobile-first, accessible, performant, and straightforward to maintain.

## 2. Goals

1. Present the wedding invitation and event information in a memorable digital experience.
2. Allow any visitor to submit one family/group RSVP through the public invitation website.
3. Let one family representative submit the total number of attendees for the household/group; do not collect individual guest responses.
4. Allow visitors to submit guestbook messages; named messages are shown immediately, anonymous ones are saved for the couple only.
5. Present itinerary, countdown, venue and directions information.
6. Include one optional background music track and considered interactive animations.
7. Persist authoritative RSVP and guestbook records in MongoDB Atlas.
8. Mirror RSVP records and guestbook messages into a private Google Sheet (write-through) for convenient administration.
9. Avoid operating a conventional always-on backend server or a separate administrative web application.

## 3. Confirmed decisions

| Area | Decision |
|---|---|
| Development environment | GitHub Copilot in VS Code |
| Project status | New project |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Database | Existing MongoDB Atlas cluster |
| Server-side execution | Vercel Serverless Functions |
| Traditional backend server | Not wanted |
| Guest structure | Family/group-level RSVP; one representative submits for the household |
| Website access | Open/public website |
| Google Sheets | One-way write-through mirror (RSVPs and guestbook); no scheduled sync |
| Hosting plan | Vercel Hobby |
| Guestbook | Named messages published immediately; anonymous messages stored and mirrored but never shown |
| Gallery | Excluded from initial release |
| Music | One track |
| Admin interface | Google Sheets; no separate dashboard required initially |
| RSVP editing | Not supported; submissions are final |
| Design direction | Agent proposes a direction; owner supplies moodboard/reference material (`design-assets/moodboard/theme/` for theme and decoration; `design-assets/moodboard/uiux-sample/` for user journey and flow only) |

## 4. Users and capabilities

### Public visitor
- View the public invitation.
- View public event itinerary and venue information.
- View the public (named) guestbook messages.
- Submit a guestbook message (optionally anonymous).

### Guest / family representative
- Open the public invitation website without a personalised link or login: external guests use the clean link; internal guests use the link with `?invite=<code>`.
- Submit one RSVP on behalf of the family/group.
- Enter the family/group name and total number of attendees, subject to their maximum (internal 10 pax with a valid invite, external 2 pax otherwise).
- Receive a confirmation after the submission is saved.
- Cannot edit an existing RSVP; duplicate submissions for the same family/group are ignored/rejected.

### Couple / administrators
- Manage guest and invitation data through the agreed data-management workflow.
- View the Google Sheets reporting mirror.
- Maintain event content and deployment configuration through the repository and environment configuration.

No public administrative dashboard is part of the initial scope.

## 5. Included modules

1. Digital invitation landing page and reveal.
2. Group-based RSVP.
3. Immediate-publication digital guestbook.
4. Event itinerary.
5. Wedding/event countdown.
6. Venue and directions.
7. One optional background music track.
8. Responsive design and purposeful animations.
9. MongoDB persistence.
10. One-way Google Sheets write-through mirror.

## 6. Excluded from initial release

- Photo gallery.
- Guest photo uploads.
- Public guest directory.
- Guest account registration.
- Separate admin dashboard.
- Two-way Sheets/MongoDB synchronisation.
- Payments, gift transactions or registry processing.
- Complex admin roles.
- Traditional Express/NestJS server.

## 7. Experience principles

- Mobile-first and responsive.
- Premium, elegant, cinematic and editorial.
- Typography-led visual hierarchy and deliberate whitespace.
- Tile-pattern/floral/wedding motifs only where supported by supplied references.
- Smooth, restrained transitions rather than animation for its own sake.
- Avoid repetitive card-grid layouts and generic SaaS styling.
- Make RSVP and event information easy to find and use.
- Support keyboard interaction, visible focus, sufficient contrast and reduced motion.
- Respect browser autoplay restrictions.

## 8. Product success criteria

The project is successful when:
- Guests can understand the invitation and find event details easily.
- A family representative can submit one group RSVP with a total attendee count.
- Duplicate group submissions are rejected or ignored and existing responses cannot be edited.
- MongoDB stores correct, non-duplicated RSVP data.
- Google Sheets reflects the authoritative MongoDB records (immediately on write; pending rows recoverable via a backfill script).
- Named guestbook submissions appear immediately and are safely rendered; anonymous ones are never shown.
- The experience works on common mobile and desktop viewport sizes.
- No private guest data or credentials are exposed to public visitors.
- Production deployment and operational checks are documented.

## 9. Assumptions

See `OPEN_DECISIONS.md` for remaining content details. The website and RSVP form are public and non-personalised. No invitation tokens, private group lookup, or guest login are used. The only differentiation is one shared `invite` URL parameter, verified server-side, which raises the attendee maximum from 2 (external, default) to 10 (internal).

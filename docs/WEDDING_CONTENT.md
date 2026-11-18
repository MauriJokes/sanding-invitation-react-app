# Wedding Content — Owner Input

This is the single source of truth for the Sanding invitation page and its RSVP configuration. This website is exclusively for the **Sanding celebration**. Do not include the other wedding events as events guests can RSVP to through this website.

## Couple and invitation copy

- Couple names: Izyan and Adam
- Couple full names: Dk Izyan Naqiyah binti Pengiran Haji Mohd. Jaludin and Nik Adam Danish bin Nik Joharris
- Invitation headline: ASSALAMUALAIKUM WBT & SALAM SEJAHTERA (followed by full name)
- Malay invitation text: Refer to `docs/WEDDING_CONTENT_INFO/invitation-text-malay.md`
- English invitation text: Refer to `docs/WEDDING_CONTENT_INFO/invitation-text-english.md`
- RSVP button label: Send RSVP

## Sanding celebration
- Displayed invitation title: "Walimatul Urus" (`shared/config/event.ts`; the owner changed it from "Walimatulurus" on 2026-11-16)
- Date (YYYY-MM-DD): 2026-12-28
- Guest arrival time (24h): 1915
- Event end time: **intentionally not published**. Show the guest arrival time only.
- Venue name: The Rizqun International Hotel
- Venue room: Songket Ballroom
- Full public venue address: Abdul Razak Complex, Jln Gadong, Bandar Seri Begawan BE3519, Brunei Darussalam
- Google Maps / directions URL: https://share.google/1Q23UIJpJpyXhl9l9
- Venue timezone: `Asia/Brunei`
- Dress code: **not shown on the site** (owner decision, 2026-11-15). `docs/WEDDING_CONTENT_INFO/dresscode.md` is kept only as the original supplied text.
- Additional guest guidance: None else so far but open to suggestions if you have any

## RSVP configuration

- RSVP scope: **One RSVP for the Sanding celebration only**
- Submission model: **One representative submits once for the whole family/group**
- Contact phone number: **required**, a Brunei (+673, default) or Malaysian (+60) number picked with a flag dropdown, stored in E.164 and visible only to the couple (D-36)
- Attendee count: **One total number for the family/group**, not separate counts per event
- RSVP deadline date: 2026-12-20 (**placeholder; owner to confirm with family**)
- RSVP deadline time: 23:59 venue local time, open through 23:59:59 (**placeholder**)
- Guest type: **external** (default, clean link) or **internal** (link with the `invite` parameter)
- Invite URL parameter: `invite`, whose value is one shared secret code (server env `INTERNAL_INVITE_CODE`; never commit the real value)
- External family link: `https://<site-domain>/` (no parameter)
- Internal family link: `https://<site-domain>/?invite=<INTERNAL_INVITE_CODE value>`
- Missing, wrong or expired `invite`: treated as external (the stricter limit)
- Internal guests' browsers remember the invite value in `localStorage` so later visits without the parameter stay internal
- Maximum attendees per internal family/group: 10 pax
- Maximum attendees per external family/group: 2 pax
- Can a family submit a declined response?: YES
- Duplicate matching convention: family/group name, canonicalised by the server
- Correction policy: no public edits; contact the couple directly if a correction is needed

## Invitation body copy (single event)

**Superseded:** the owner has since rewritten the invitation lines, the host list and the itinerary directly in `src/i18n/strings.ts` and `src/features/details/content.ts`; those files are now the source of truth, and the supplied texts in `docs/WEDDING_CONTENT_INFO/` are kept only as the original input. The text below is the earlier proposal, kept for history.

Earlier proposal (owner to proofread the Malay):

- Malay: "...untuk hadir ke Majlis Walimatulurus anakanda kami:"
- English: "...to attend the walimatulurus of our beloved children:"

The supplied opening line ("Dengan izin Allah S.W.T dan rahmatnya, kami:" / "By the grace and blessings of Allah S.W.T, we") is kept before the hosts. Then show the couple's names: headline, then full names from the section above. The supplied files' opening ("Bismillah / ASSALAMU'ALAIKUM WR. WB.") and the headline "ASSALAMUALAIKUM WBT & SALAM SEJAHTERA" overlap. **Confirmed:** keep "Bismillah", use the headline once, and omit the duplicate "ASSALAMU'ALAIKUM WR. WB." line. The source files are left unedited.

## Venue / event copy

- Parking instructions: not needed (well-known venue).
- Arrival guidance: not needed.
- Contact/help wording: not needed.

## Publishing checklist

- [ ] The page presents only the Sanding celebration.
- [ ] The Sanding date and arrival time are confirmed (no end time is published).
- [ ] Event names are consistent across Malay and English.
- [ ] Venue address and map URL are tested.
- [ ] RSVP deadline placeholder (2026-12-20 23:59) is replaced with the confirmed value.
- [x] Maximum attendee count is agreed (internal 10 pax, external 2 pax).
- [ ] `INTERNAL_INVITE_CODE` is generated (long, random) and the internal link is shared only with internal family; the external link is the clean URL.
- [ ] RSVP form makes clear that the response covers the whole family/group (the owner removed the separate "Sanding only" note on 2026-11-16; the page presents only this one event).
- [ ] The form collects one total attendee count, not per-event attendance.
- [ ] The form shows the correct maximum (10 with a valid invite, otherwise 2).

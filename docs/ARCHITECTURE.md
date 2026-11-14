# Technical Architecture

## 1. Architecture summary

Single repository, static frontend build and serverless API functions.

- Browser application: React + Vite + TypeScript.
- Styling: Tailwind CSS.
- Motion: Framer Motion, if approved in dependency review.
- API execution: Vercel Functions.
- Persistence: MongoDB Atlas using the official MongoDB Node.js driver.
- Reporting: Google Sheets API (write-through mirror).
- Hosting: Vercel.

There is no separate always-on backend server. Vercel Functions are still server-side code and form the application's API/backend boundary.

## 2. Trust boundaries

### Browser
May contain:
- Public event information.
- UI state.
- Guest-entered form values.
- Short-lived, non-sensitive UI state.

Must not contain:
- MongoDB URI or credentials.
- Google service-account private key.
- Admin secrets.
- Raw server-side signing secrets.
- Direct privileged database access.

### Vercel Functions
Responsible for:
- Input validation.
- Invite-code verification (derives `guestType`).
- RSVP eligibility and deadline enforcement.
- MongoDB reads and writes.
- Guestbook validation and retrieval.
- Google Sheets write-through.
- Rate limiting (MongoDB TTL collection keyed by hashed IP).

### MongoDB Atlas
Authoritative source of RSVP and guestbook data, plus rate-limit counters.

### Google Sheets
Private reporting mirror. It is not a second write authority.

## 3. Suggested repository layout

```text
.
├── .github/
│   ├── copilot-instructions.md
│   └── skills/
├── api/
│   ├── rsvp/
│   │   ├── config.ts
│   │   └── index.ts
│   └── guestbook/
│       └── index.ts
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   └── types/
├── shared/            # pure TS used by browser and server: event config, deadline, Zod schemas, MAX_ATTENDEES
├── server/
│   ├── database/
│   ├── repositories/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── scripts/           # index setup, Sheets backfill
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── prompts/
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

This is a suggested structure, not a mandate to create empty directories. Keep the actual implementation proportional to the application.

## 4. Code boundaries

- `src/` is browser-only.
- `shared/` holds pure, dependency-light TypeScript importable by both `src/` and `server/`; it must not import Node APIs, secrets or `server/`.
- `api/` contains Vercel Function entry points.
- `server/` contains server-only modules.
- Browser code must never import from `server/`.
- API handlers should remain thin: parse request, call service, return response.
- Business rules belong in services/domain functions, not React components or HTTP handlers.
- Database access belongs behind repositories or focused data-access modules.
- Avoid speculative layers and unnecessary dependency injection frameworks.

## 5. Suggested dependencies

Evaluate current compatibility before installing. Prefer the minimum set needed.

Runtime candidates:
- `react`
- `react-dom`
- `zod`
- `mongodb`
- `@googleapis/sheets` (narrow client; verify compatibility at install time)
- `motion` only if the approved design needs it; start with CSS/Web Animations

Development candidates:
- `vite`
- `typescript`
- `tailwindcss`
- `@tailwindcss/vite` if using Tailwind CSS v4 with Vite
- `vitest`
- `@testing-library/react`
- `playwright`
- ESLint and relevant TypeScript plugins

Do not add a router, i18n library, date library, state-management library, ORM, server framework or component library without a demonstrated need. shadcn/ui may be used selectively if it fits the approved design.

## 6. Vercel Functions

Use the Vercel-supported function entry-point conventions for the selected project configuration. Confirm the current Vercel runtime and TypeScript conventions before implementation.

Requirements:
- Explicit method handling.
- Request size limits.
- Zod validation.
- Consistent response shape.
- Appropriate status codes.
- No secrets in responses.
- Server-only imports.
- Timeouts and execution limits respected.

## 7. MongoDB connection handling

- Reuse a cached MongoClient across warm function invocations.
- Do not connect and disconnect on every request.
- Keep connection configuration server-side.
- Create indexes through `scripts/` (explicit setup), never per request.
- Indexes: unique `rsvps.canonicalGroupKey`; `guestbookEntries { isPublic, createdAt, _id }`; TTL on `rateLimits.expiresAt`; partial `sheetStatus: "pending"` indexes. See `DATA_MODEL.md`.
- Atlas network access: Vercel Functions have no static egress IPs on Hobby, so Atlas typically needs `0.0.0.0/0`. Compensate with a least-privilege database user, a long random password and separate dev/prod databases.

## 8. Google Sheets write-through

One-way, per-submission append. See `GOOGLE_SHEETS_SYNC.md`.

1. Insert into MongoDB with `sheetStatus: "pending"`.
2. Await a Sheets append with a short timeout.
3. On success mark `synced`; on failure leave `pending` and still return success.
4. A manually run `scripts/backfill-sheets.ts` appends pending rows idempotently.

No scheduled function, sync-state collection or internal sync route exists.

## 9. Deployment

- GitHub repository connected to Vercel (Hobby plan).
- Preview deployments for branches/PRs; production from the designated branch.
- Separate local, preview and production environment variables.
- Pin an LTS Node version (`.nvmrc` and Vercel project setting).
- Local development with `vercel dev` (plain `vite` does not serve `api/`).
- Security headers in `vercel.json` (`Referrer-Policy: no-referrer`, `X-Content-Type-Options`, frame and permissions policies).
- No cron jobs. Do not add `vercel.json` crons on Hobby (daily limit only).
- No secrets committed to Git.

## 10. Architecture decision rule

When choosing between two viable implementations, prefer the simpler option that:
- Meets all confirmed requirements.
- Preserves data integrity.
- Respects trust boundaries.
- Is testable.
- Does not add infrastructure or dependencies without clear benefit.

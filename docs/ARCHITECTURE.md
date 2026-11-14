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
├── scripts/           # dev-only API plugin now; index setup and Sheets backfill later
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

Implementation conventions (M2):
- Handlers use the web-standard export: `export default { fetch(request: Request): Response | Promise<Response> }`, one file per route under `api/` (four routes, well under the Hobby function limit). Vercel recommends fewer, shared functions; consolidate behind one router only if cold starts or per-function connection pools become a problem.
- Server modules, `shared/` and `api/` use explicit `.js` extensions in relative imports so they run under Node ESM (`"type": "module"`) however Vercel compiles them. `tsconfig.server.json` uses `NodeNext` so omissions fail `npm run typecheck`.
- `api/` holds entry points only; shared helpers live in `server/` (Vercel turns every file in `api/` into a function).
- `server/http/response.ts` provides the common `{ data, error }` response shape with `Cache-Control: no-store`.
- `server/config/env.ts` validates configuration per feature group (database, Sheets, security) with Zod when the feature first needs it. Errors list variable names only.
- `GET /api/health` returns `{ status, rsvpOpen }` and reads no secrets.
- `server/http/route.ts` (`jsonPostRoute`) is the shared pipeline for public JSON POST routes (method, bounded body, Zod, rate limit, handler, error mapping); see `API_CONTRACTS.md`. `api/rsvp/config.ts` and `api/rsvp/index.ts` are thin: they pick a schema, a rate-limit policy and call `server/rsvp/service.ts`.
- RSVP rules live in `server/rsvp/` (`guest-type.ts` constant-time invite check that fails closed to external, `canonical.ts`, `repository.ts` insert-only with duplicate-key translation, `service.ts` deadline, limits and mapping). Services take a repository and `now` as arguments, so rules are unit-tested with a fake repository and the real database behaviour is integration-tested.

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

- Reuse a cached MongoClient across warm function invocations (`server/db/client.ts`: module-level promise, pool of up to 5, 5 s idle timeout so suspended instances release Atlas connections, 5 s connect and server-selection timeouts; a failed connect is not cached). If Atlas connection counts ever become a problem, add `attachDatabasePool` from `@vercel/functions`.
- Do not connect and disconnect on every request.
- Keep connection configuration server-side.
- **Run `npm run db:indexes` against every database before it takes RSVPs.** The unique `canonicalGroupKey` index is the only duplicate guard: without it the API silently accepts duplicate families (verified during M4 on a database that had never been set up). Create indexes with `npm run db:indexes` (`scripts/setup-indexes.ts` calling `server/db/indexes.ts`, the only place indexes are defined), never per request. It is idempotent; a changed definition under an existing name fails loudly. Run it once per database (dev, preview if separate, production) before first use.
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
- Node 24 LTS, pinned in `.nvmrc` and `package.json` `engines` (`24.x`), which Vercel honours over the project default.
- Local development: `npm run dev` serves `api/**` through a small dev-only Vite plugin (`scripts/dev-api.ts`) using the same web-standard `fetch` handler convention as Vercel, and loads `.env.local`. `vercel dev` also works once the Vercel CLI is logged in. `vite preview` serves the static build only. The Vite dev server serves project source files (not `.env*`) on localhost; never expose it with `--host` on an untrusted network.
- Security headers and a Content-Security-Policy in `vercel.json` (`Referrer-Policy: no-referrer`, `X-Content-Type-Options`, frame and permissions policies; scripts, styles, fonts, images, media and connections limited to `'self'`, with inline style attributes only). `vite preview` applies the same headers from `vercel.json`, so the CSP can be verified locally. Hashed `/assets/*` are cached immutably.
- No cron jobs. Do not add `vercel.json` crons on Hobby (daily limit only).
- No secrets committed to Git.

### Browser structure (M4)

- `src/features/rsvp/`: `invite.ts` (reads and removes `?invite=`, `localStorage` with safe fallbacks), `api.ts` (typed `fetch` client that validates every response by hand and returns `ok`, a typed API error, or "no usable answer"), `useRsvpConfig.ts` (asks the server for the limit; stores an accepted invite and clears a rejected one), `RsvpSection.tsx` (form, states, confirmation).
- `src/i18n/`: typed Malay/English strings and a small provider. The browser imports only `shared/rsvp/constants.ts`, never the Zod schemas, so Zod stays out of the browser bundle (about 74 kB gzipped JS in total).
- **Hardened against page rewriting.** Chrome's translator (and some extensions) replace text nodes with `<font>` wrappers. React then fails with an `insertBefore`/`removeChild` `NotFoundError` when it adds or removes a node next to bare text, and unmounts the whole page, leaving only the navy body background (an M4 bug found on the Vercel preview). Rules: never conditionally render a node beside bare text (render it always and hide it with CSS, or give the text its own element); `index.html` sets `translate="no"`; `ErrorBoundary` + `CrashNotice` in `main.tsx` replace a crashed page with a reload message in both languages; `tests/unit/rsvp/RsvpSection.test.tsx` simulates a translator.
- `main.tsx` resolves the invite exactly once before rendering (React StrictMode runs effects twice, and the first read removes it from the address bar).

### Local development and tests

- Copy `.env.example` to `.env.local` (git-ignored) and fill in a **development** database. `npm run dev` and `npm run db:indexes` read it.
- `npm test` runs unit tests (no database). `npm run test:integration` runs the real route handlers against MongoDB and needs `MONGODB_URI` plus `MONGODB_TEST_DATABASE`; the name must contain "test" and differ from `MONGODB_DATABASE`, because the tests empty their collections. They fail loudly (never skip) when the variables are missing. `npm run test:all` runs both.
- Atlas runs a TTL monitor about once a minute, so integration tests verify the TTL index definition and expiry timestamps, not actual deletion.

## 10. Architecture decision rule

When choosing between two viable implementations, prefer the simpler option that:
- Meets all confirmed requirements.
- Preserves data integrity.
- Respects trust boundaries.
- Is testable.
- Does not add infrastructure or dependencies without clear benefit.

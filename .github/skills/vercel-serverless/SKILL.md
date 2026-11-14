---
name: vercel-serverless
description: >
  Use when creating or modifying Vercel Function endpoints, request handlers, server-side validation, API errors, or deployment configuration (Hobby plan: no cron, no internal routes).
---

# Vercel Serverless Skill

## Objective
Implement secure, short-lived server-side operations using Vercel Functions without introducing a traditional backend server.

## Read first
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/SECURITY_REQUIREMENTS.md`
- Relevant feature specification.

## Runtime discipline
Confirm the current Vercel function conventions and selected runtime before implementation. Do not assume a particular handler signature or legacy runtime.

## Handler rules
- Explicitly handle supported HTTP methods.
- Validate request size and content type where applicable.
- Parse and validate all external input with Zod.
- Return consistent, safe response shapes.
- Use appropriate status codes.
- Do not expose stack traces, credentials, database errors or private records.
- Keep handlers thin; delegate business logic to services.
- Use server-only imports and configuration.
- Never trust `guestType`, limits or any identifier supplied by the browser; derive them server-side.

## Security
- Enforce invite-derived limits, duplicate checks and the RSVP deadline server-side.
- Rate-limit public endpoints using the MongoDB TTL collection keyed by a salted-hash IP.
- Avoid token/secret logging.
- Apply safe CORS policy; do not use permissive credentialed wildcard CORS.
- Use secure cookie attributes if session cookies are adopted.
- Avoid leaking whether private identifiers exist.

## Serverless constraints
- Reuse database clients across warm invocations where appropriate.
- Do not rely on in-memory state for durable locks, sessions or queues.
- Respect execution duration and memory limits.
- Avoid long-running work in guest-facing request paths.
- Do not add cron jobs (Hobby allows daily only). Await short Sheets appends inside the request.
- Ensure retryable operations are idempotent.

## Testing
Test method errors, malformed bodies, oversized payloads, unauthorised access, rate limits, expected business conflicts and unexpected failures.

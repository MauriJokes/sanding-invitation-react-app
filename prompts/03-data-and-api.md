# Milestone 2 — Data and API Foundation

Activate `vercel-serverless`, `mongodb-data` and `quality-assurance`.

Read the approved data model, API contracts and security requirements.

Implement:
- MongoDB connection reuse.
- Typed data-access modules.
- Explicit index setup script.
- Zod request schemas.
- Common API response/error utilities.
- `shared/` typed event config (single event; deadline placeholder) and the MongoDB TTL rate-limit helper.
- Unit and integration tests for data-access behaviour.

Do not seed real guest data or create public guest endpoints exposing private records. There is no invitation lookup. Implement `POST /api/rsvp/config` with the invite in the request body (decision D-21).

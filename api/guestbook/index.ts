import { guestbookQuerySchema, guestbookRequestSchema } from "../../shared/guestbook/schemas.js";
import { createGuestbookRepository } from "../../server/guestbook/repository.js";
import { listGuestbook, submitGuestbookEntry } from "../../server/guestbook/service.js";
import { fail, ok } from "../../server/http/response.js";
import { jsonPostRoute, publicGetRoute } from "../../server/http/route.js";
import { mirrorGuestbookEntry } from "../../server/sheets/mirror.js";

const get = publicGetRoute({
  parse: (url) =>
    guestbookQuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    }),
  rateLimit: { scope: "guestbook-read", limit: 120, windowSeconds: 600 },
  async handle(query, { db }) {
    return ok(await listGuestbook(query, { repo: createGuestbookRepository(db) }));
  },
});

const post = jsonPostRoute({
  schema: guestbookRequestSchema,
  // Guests at the venue may share one Wi-Fi address, so this is deliberately generous.
  rateLimit: { scope: "guestbook-write", limit: 20, windowSeconds: 600 },
  maxBodyBytes: 8192,
  async handle(input, { db, now }) {
    const result = await submitGuestbookEntry(input, {
      repo: createGuestbookRepository(db),
      now,
      afterInsert: (id, doc) => mirrorGuestbookEntry(db, id, doc),
    });
    return ok(result, 201);
  },
});

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") return get.fetch(request);
    if (request.method === "POST") return post.fetch(request);
    return fail("METHOD_NOT_ALLOWED", "Method not allowed.", 405, { headers: { Allow: "GET, POST" } });
  },
};

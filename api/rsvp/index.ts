import { rsvpRequestSchema } from "../../shared/rsvp/schemas.js";
import { getInviteEnv } from "../../server/config/env.js";
import { jsonPostRoute } from "../../server/http/route.js";
import { ok } from "../../server/http/response.js";
import { createRsvpRepository } from "../../server/rsvp/repository.js";
import { submitRsvp } from "../../server/rsvp/service.js";

export default jsonPostRoute({
  schema: rsvpRequestSchema,
  rateLimit: { scope: "rsvp", limit: 10, windowSeconds: 600 },
  async handle(input, { db, now }) {
    const { INTERNAL_INVITE_CODE } = getInviteEnv();
    const result = await submitRsvp(input, {
      repo: createRsvpRepository(db),
      inviteCode: INTERNAL_INVITE_CODE,
      now,
    });
    return ok(result, 201);
  },
});

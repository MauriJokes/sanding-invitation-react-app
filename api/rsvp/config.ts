import { rsvpConfigRequestSchema } from "../../shared/rsvp/schemas.js";
import { getInviteEnv } from "../../server/config/env.js";
import { jsonPostRoute } from "../../server/http/route.js";
import { ok } from "../../server/http/response.js";
import { requireRsvpIndexes } from "../../server/rsvp/index-guard.js";
import { getRsvpConfig } from "../../server/rsvp/service.js";

export default jsonPostRoute({
  schema: rsvpConfigRequestSchema,
  rateLimit: { scope: "rsvp-config", limit: 30, windowSeconds: 600 },
  maxBodyBytes: 512,
  async handle(input, { db, now }) {
    // Same check as the submit route, so a guest is not invited to fill in a form that cannot be saved.
    await requireRsvpIndexes(db, now);
    const { INTERNAL_INVITE_CODE } = getInviteEnv();
    return ok(getRsvpConfig(input, { inviteCode: INTERNAL_INVITE_CODE, now }));
  },
});

import { rsvpConfigRequestSchema } from "../../shared/rsvp/schemas.js";
import { getInviteEnv } from "../../server/config/env.js";
import { jsonPostRoute } from "../../server/http/route.js";
import { ok } from "../../server/http/response.js";
import { getRsvpConfig } from "../../server/rsvp/service.js";

export default jsonPostRoute({
  schema: rsvpConfigRequestSchema,
  rateLimit: { scope: "rsvp-config", limit: 30, windowSeconds: 600 },
  maxBodyBytes: 512,
  handle(input, { now }) {
    const { INTERNAL_INVITE_CODE } = getInviteEnv();
    return Promise.resolve(ok(getRsvpConfig(input, { inviteCode: INTERNAL_INVITE_CODE, now })));
  },
});

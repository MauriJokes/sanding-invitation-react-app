import { fail, ok } from "../server/http/response.js";
import { isRsvpOpen } from "../shared/config/event.js";

export default {
  fetch(request: Request): Response {
    if (request.method !== "GET") {
      return fail("METHOD_NOT_ALLOWED", "Method not allowed.", 405, { headers: { Allow: "GET" } });
    }
    return ok({ status: "ok", rsvpOpen: isRsvpOpen(new Date()) });
  },
};

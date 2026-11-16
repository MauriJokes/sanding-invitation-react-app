import type { ObjectId } from "mongodb";
import { isRsvpOpen } from "../../shared/config/event.js";
import {
  MAX_ATTENDEES,
  type RsvpConfigRequest,
  type RsvpConfigResponse,
  type RsvpRequest,
  type RsvpSubmittedResponse,
} from "../../shared/rsvp/schemas.js";
import type { RsvpDocument } from "../db/collections.js";
import { AppError } from "../http/errors.js";
import { canonicalGroupKey } from "./canonical.js";
import { deriveGuestType } from "./guest-type.js";
import { DuplicateRsvpError, type RsvpRepository } from "./repository.js";

export interface RsvpDeps {
  repo: RsvpRepository;
  inviteCode: string;
  now: Date;
  /** Runs after the insert succeeded (the Sheets write-through). Must not throw. */
  afterInsert?: (id: ObjectId, doc: RsvpDocument) => Promise<unknown>;
}

/** Tells the form which limit applies. Never reveals more than the number. */
export function getRsvpConfig(
  input: RsvpConfigRequest,
  deps: Pick<RsvpDeps, "inviteCode" | "now">,
): RsvpConfigResponse {
  const guestType = deriveGuestType(input.invite, deps.inviteCode);
  return { maxAttendees: MAX_ATTENDEES[guestType], rsvpOpen: isRsvpOpen(deps.now) };
}

export async function submitRsvp(input: RsvpRequest, deps: RsvpDeps): Promise<RsvpSubmittedResponse> {
  if (!isRsvpOpen(deps.now)) {
    throw new AppError("RSVP_CLOSED", 409, "RSVP is now closed.");
  }

  const guestType = deriveGuestType(input.invite, deps.inviteCode);
  const max = MAX_ATTENDEES[guestType];

  if (input.status === "declined") {
    if (input.attendeeCount !== 0) {
      throw new AppError("VALIDATION_ERROR", 400, "Please check your responses.", { fields: ["attendeeCount"] });
    }
  } else if (input.attendeeCount < 1) {
    throw new AppError("VALIDATION_ERROR", 400, "Please check your responses.", { fields: ["attendeeCount"] });
  } else if (input.attendeeCount > max) {
    throw new AppError("ATTENDEE_LIMIT_EXCEEDED", 400, `The maximum is ${max} attendees.`, {
      fields: ["attendeeCount"],
    });
  }

  const doc: RsvpDocument = {
    familyGroupName: input.familyGroupName,
    canonicalGroupKey: canonicalGroupKey(input.familyGroupName),
    phoneNumber: input.phoneNumber,
    status: input.status,
    attendeeCount: input.attendeeCount,
    guestType,
    createdAt: deps.now,
    sheetStatus: "pending",
  };
  let id: ObjectId;
  try {
    id = await deps.repo.insert(doc);
  } catch (error) {
    if (error instanceof DuplicateRsvpError) {
      throw new AppError("RSVP_DUPLICATE", 409, "An RSVP for this family/group has already been received.");
    }
    throw error;
  }

  await deps.afterInsert?.(id, doc);
  return { status: input.status, attendeeCount: input.attendeeCount };
}

import type {
  RsvpConfigResponse,
  RsvpStatus,
  RsvpSubmittedResponse,
} from "../../../shared/rsvp/constants";

import { isRecord, requestJson, type ApiResult } from "../../lib/http";

export type { ApiResult };

function parseConfig(data: unknown): RsvpConfigResponse | undefined {
  if (!isRecord(data)) return undefined;
  const { maxAttendees, rsvpOpen } = data;
  if (
    typeof maxAttendees !== "number" ||
    !Number.isInteger(maxAttendees) ||
    maxAttendees < 1 ||
    maxAttendees > 100
  ) {
    return undefined;
  }
  if (typeof rsvpOpen !== "boolean") return undefined;
  return { maxAttendees, rsvpOpen };
}

function parseSubmitted(data: unknown): RsvpSubmittedResponse | undefined {
  if (!isRecord(data)) return undefined;
  const { status, attendeeCount } = data;
  if (
    (status !== "attending" && status !== "declined") ||
    typeof attendeeCount !== "number"
  )
    return undefined;
  return { status, attendeeCount };
}

/** The invite travels in the body, never in a URL. */
export function fetchRsvpConfig(
  invite: string | undefined,
  signal?: AbortSignal,
): Promise<ApiResult<RsvpConfigResponse>> {
  return requestJson(
    "POST",
    "/api/rsvp/config",
    invite ? { invite } : {},
    parseConfig,
    signal,
  );
}

export interface RsvpPayload {
  familyGroupName: string;
  phoneNumber: string;
  status: RsvpStatus;
  attendeeCount: number;
  /** Only set when the server has already confirmed it. The client never sends a guest type or a limit. */
  invite: string | undefined;
}

export function submitRsvp(
  payload: RsvpPayload,
): Promise<ApiResult<RsvpSubmittedResponse>> {
  const { invite, ...rest } = payload;
  return requestJson(
    "POST",
    "/api/rsvp",
    invite ? { ...rest, invite } : rest,
    parseSubmitted,
  );
}

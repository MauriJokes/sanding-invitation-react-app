import type { RsvpConfigResponse, RsvpStatus, RsvpSubmittedResponse } from "../../../shared/rsvp/constants";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: "api"; status: number; code: string; fields: string[] }
  /** No usable response: offline, timeout, aborted, or a body that is not the documented shape. */
  | { ok: false; kind: "network" };

const REQUEST_TIMEOUT_MS = 15_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseConfig(data: unknown): RsvpConfigResponse | undefined {
  if (!isRecord(data)) return undefined;
  const { maxAttendees, rsvpOpen } = data;
  if (typeof maxAttendees !== "number" || !Number.isInteger(maxAttendees) || maxAttendees < 1 || maxAttendees > 100) {
    return undefined;
  }
  if (typeof rsvpOpen !== "boolean") return undefined;
  return { maxAttendees, rsvpOpen };
}

function parseSubmitted(data: unknown): RsvpSubmittedResponse | undefined {
  if (!isRecord(data)) return undefined;
  const { status, attendeeCount } = data;
  if ((status !== "attending" && status !== "declined") || typeof attendeeCount !== "number") return undefined;
  return { status, attendeeCount };
}

async function postJson<T>(
  path: string,
  body: unknown,
  parse: (data: unknown) => T | undefined,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  try {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      return { ok: false, kind: "network" };
    }
    if (!isRecord(envelope)) return { ok: false, kind: "network" };

    if (response.ok) {
      const data = parse(envelope.data);
      return data === undefined ? { ok: false, kind: "network" } : { ok: true, data };
    }

    const error = envelope.error;
    if (!isRecord(error) || typeof error.code !== "string") return { ok: false, kind: "network" };
    const fields = Array.isArray(error.fields) ? error.fields.filter((f): f is string => typeof f === "string") : [];
    return { ok: false, kind: "api", status: response.status, code: error.code, fields };
  } catch {
    return { ok: false, kind: "network" };
  }
}

/** The invite travels in the body, never in a URL. */
export function fetchRsvpConfig(invite: string | undefined, signal?: AbortSignal): Promise<ApiResult<RsvpConfigResponse>> {
  return postJson("/api/rsvp/config", invite ? { invite } : {}, parseConfig, signal);
}

export interface RsvpPayload {
  familyGroupName: string;
  status: RsvpStatus;
  attendeeCount: number;
  /** Only set when the server has already confirmed it. The client never sends a guest type or a limit. */
  invite: string | undefined;
}

export function submitRsvp(payload: RsvpPayload): Promise<ApiResult<RsvpSubmittedResponse>> {
  const { invite, ...rest } = payload;
  return postJson("/api/rsvp", invite ? { ...rest, invite } : rest, parseSubmitted);
}

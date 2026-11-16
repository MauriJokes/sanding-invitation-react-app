import { CURSOR_PATTERN, type GuestbookPage, type GuestbookSubmitted, type PublicGuestbookEntry } from "../../../shared/guestbook/constants";
import { isRecord, requestJson, type ApiResult } from "../../lib/http";

function parsePage(data: unknown): GuestbookPage | undefined {
  if (!isRecord(data) || !Array.isArray(data.entries)) return undefined;
  const entries: PublicGuestbookEntry[] = [];
  for (const item of data.entries as unknown[]) {
    if (!isRecord(item)) return undefined;
    const { displayName, message, createdAt } = item;
    if (typeof displayName !== "string" || typeof message !== "string" || typeof createdAt !== "string") return undefined;
    entries.push({ displayName, message, createdAt });
  }
  const { nextCursor } = data;
  if (nextCursor !== null && !(typeof nextCursor === "string" && CURSOR_PATTERN.test(nextCursor))) return undefined;
  return { entries, nextCursor };
}

function parseSubmitted(data: unknown): GuestbookSubmitted | undefined {
  return isRecord(data) && typeof data.published === "boolean" ? { published: data.published } : undefined;
}

export function fetchGuestbookPage(cursor: string | undefined, signal?: AbortSignal): Promise<ApiResult<GuestbookPage>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return requestJson("GET", `/api/guestbook${query}`, undefined, parsePage, signal);
}

export interface GuestbookPayload {
  displayName: string;
  anonymous: boolean;
  message: string;
  /** The hidden spam trap. Always sent exactly as the browser has it (empty for a person). */
  homepage: string;
}

export function submitGuestbook(payload: GuestbookPayload): Promise<ApiResult<GuestbookSubmitted>> {
  return requestJson("POST", "/api/guestbook", payload, parseSubmitted);
}

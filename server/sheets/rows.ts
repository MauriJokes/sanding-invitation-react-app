import type { GuestbookDocument, RsvpDocument } from "../db/collections.js";
import { VENUE_TIMEZONE } from "../../shared/config/event.js";

export type SheetValue = string | number;

/** A worksheet the app owns: its tab name (from the environment) and its fixed header row. */
export interface WorksheetSpec {
  name: string;
  headers: readonly string[];
}

export const RSVP_HEADERS = [
  "RSVP ID",
  "Submitted At",
  "Family / Group Name",
  "Guest Type",
  "RSVP Status",
  "Attendee Count",
  "Phone Number",
] as const;

export const GUESTBOOK_HEADERS = ["Entry ID", "Submitted At", "Name", "Visibility", "Message"] as const;

/** ISO-8601 in venue time with its offset, e.g. 2026-12-28T19:15:00+08:00. */
export function formatVenueTimestamp(date: Date, timeZone: string = VENUE_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const offset = get("timeZoneName").replace("GMT", "") || "+00:00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${offset.length === 3 ? `${offset}:00` : offset}`;
}

/**
 * Rows contain only what the couple needs. Never the invite code, IP data or secrets.
 * The sheet is written with RAW input, so text such as "=1+1" is stored as text, not run as a formula.
 */
export function rsvpRow(id: string, doc: Pick<RsvpDocument, "createdAt" | "familyGroupName" | "guestType" | "status" | "attendeeCount" | "phoneNumber">): SheetValue[] {
  return [id, formatVenueTimestamp(doc.createdAt), doc.familyGroupName, doc.guestType, doc.status, doc.attendeeCount, doc.phoneNumber];
}

export function guestbookRow(id: string, doc: Pick<GuestbookDocument, "createdAt" | "displayName" | "isPublic" | "message">): SheetValue[] {
  return [id, formatVenueTimestamp(doc.createdAt), doc.displayName ?? "", doc.isPublic ? "public" : "anonymous", doc.message];
}

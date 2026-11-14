import type { Db, ObjectId } from "mongodb";
import type { GuestType, RsvpStatus } from "../../shared/rsvp/schemas.js";

export const COLLECTIONS = {
  rsvps: "rsvps",
  guestbookEntries: "guestbookEntries",
  rateLimits: "rateLimits",
} as const;

export type SheetStatus = "pending" | "synced";

export interface RsvpDocument {
  _id?: ObjectId;
  familyGroupName: string;
  canonicalGroupKey: string;
  status: RsvpStatus;
  attendeeCount: number;
  guestType: GuestType;
  createdAt: Date;
  sheetStatus: SheetStatus;
  sheetSyncedAt?: Date;
}

export interface GuestbookDocument {
  _id?: ObjectId;
  /** Optional. May be kept for anonymous entries so the couple can see who wrote them (never shown publicly). */
  displayName?: string;
  message: string;
  /** True only when a name was given and "send anonymously" was not chosen. The only entries the public API returns. */
  isPublic: boolean;
  createdAt: Date;
  sheetStatus: SheetStatus;
  sheetSyncedAt?: Date;
}

export interface RateLimitDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}

export const rsvpsCollection = (db: Db) => db.collection<RsvpDocument>(COLLECTIONS.rsvps);
export const guestbookCollection = (db: Db) => db.collection<GuestbookDocument>(COLLECTIONS.guestbookEntries);
export const rateLimitsCollection = (db: Db) => db.collection<RateLimitDocument>(COLLECTIONS.rateLimits);

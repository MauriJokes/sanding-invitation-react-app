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
  phoneNumber: string;
  status: RsvpStatus;
  attendeeCount: number;
  guestType: GuestType;
  createdAt: Date;
  sheetStatus: SheetStatus;
  sheetSyncedAt?: Date;
}

export interface GuestbookDocument {
  _id?: ObjectId;
  /** Always given for new entries, so the couple know who wrote them. Only shown publicly when `isPublic`. Older entries may have none. */
  displayName?: string;
  message: string;
  /** False when the guest chose to send privately. The only entries the public API returns are the public ones. */
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

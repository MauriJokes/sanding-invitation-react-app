import type { Db, ObjectId } from "mongodb";
import type { GuestType, RsvpStatus } from "../../shared/rsvp/schemas.js";

export const COLLECTIONS = {
  rsvps: "rsvps",
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

export interface RateLimitDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}

export const rsvpsCollection = (db: Db) => db.collection<RsvpDocument>(COLLECTIONS.rsvps);
export const rateLimitsCollection = (db: Db) => db.collection<RateLimitDocument>(COLLECTIONS.rateLimits);

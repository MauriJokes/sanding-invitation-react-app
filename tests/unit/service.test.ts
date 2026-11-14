import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { RSVP_DEADLINE } from "../../shared/config/event";
import type { RsvpDocument } from "../../server/db/collections";
import { AppError } from "../../server/http/errors";
import { DuplicateRsvpError, type RsvpRepository } from "../../server/rsvp/repository";
import { getRsvpConfig, submitRsvp } from "../../server/rsvp/service";
import { rsvpRequestSchema } from "../../shared/rsvp/schemas";

const INVITE = "k7Qm2-xV9pLr4TnB8wZc_Hd3";
const BEFORE_DEADLINE = new Date("2026-12-01T12:00:00+08:00");

class FakeRepo implements RsvpRepository {
  readonly docs: Omit<RsvpDocument, "_id">[] = [];
  insert(doc: Omit<RsvpDocument, "_id">): Promise<ObjectId> {
    if (this.docs.some((d) => d.canonicalGroupKey === doc.canonicalGroupKey)) {
      return Promise.reject(new DuplicateRsvpError());
    }
    this.docs.push(doc);
    return Promise.resolve(new ObjectId());
  }
}

const input = (over: Record<string, unknown> = {}) =>
  rsvpRequestSchema.parse({ familyGroupName: "The Ahmad Family", status: "attending", attendeeCount: 2, ...over });

const submit = (repo: FakeRepo, over: Record<string, unknown> = {}, now = BEFORE_DEADLINE) =>
  submitRsvp(input(over), { repo, inviteCode: INVITE, now });

async function appError(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("expected an AppError");
}

describe("getRsvpConfig", () => {
  it("returns 10 for a valid invite and 2 for everything else, in the same shape", () => {
    const deps = { inviteCode: INVITE, now: BEFORE_DEADLINE };
    const internal = getRsvpConfig({ invite: INVITE }, deps);
    const none = getRsvpConfig({}, deps);
    const wrong = getRsvpConfig({ invite: "wrong-wrong-wrong-wrong-1" }, deps);
    expect(internal).toEqual({ maxAttendees: 10, rsvpOpen: true });
    expect(none).toEqual({ maxAttendees: 2, rsvpOpen: true });
    expect(wrong).toEqual(none);
    expect(Object.keys(wrong)).toEqual(Object.keys(internal));
  });

  it("reports when RSVP has closed", () => {
    const after = new Date(Date.parse(RSVP_DEADLINE) + 1);
    expect(getRsvpConfig({}, { inviteCode: INVITE, now: after }).rsvpOpen).toBe(false);
  });
});

describe("submitRsvp: attendee limits", () => {
  it.each([
    ["external, clean link", undefined, 2, true],
    ["external, clean link", undefined, 3, false],
    ["external, wrong invite", "wrong-wrong-wrong-wrong-1", 3, false],
    ["external, rotated invite", "an-older-invite-code-12345", 10, false],
    ["internal, valid invite", INVITE, 10, true],
    ["internal, valid invite", INVITE, 11, false],
  ])("%s with %i attendees", async (_name, invite, count, accepted) => {
    const repo = new FakeRepo();
    const run = submit(repo, { invite, attendeeCount: count });
    if (accepted) {
      await expect(run).resolves.toEqual({ status: "attending", attendeeCount: count });
      expect(repo.docs).toHaveLength(1);
    } else {
      const error = await appError(run);
      expect([error.status, error.code, error.fields]).toEqual([400, "ATTENDEE_LIMIT_EXCEEDED", ["attendeeCount"]]);
      expect(repo.docs).toHaveLength(0);
    }
  });

  it("states only the applicable maximum and never the other guest type's", async () => {
    const external = await appError(submit(new FakeRepo(), { attendeeCount: 3 }));
    expect(external.message).toBe("The maximum is 2 attendees.");
    expect(external.message).not.toContain("10");
    const internal = await appError(submit(new FakeRepo(), { invite: INVITE, attendeeCount: 11 }));
    expect(internal.message).toBe("The maximum is 10 attendees.");
  });

  it("requires at least one attendee when attending", async () => {
    const error = await appError(submit(new FakeRepo(), { attendeeCount: 0 }));
    expect([error.status, error.code]).toEqual([400, "VALIDATION_ERROR"]);
  });

  it("stores a declined RSVP explicitly with zero attendees, and rejects a declined RSVP with a count", async () => {
    const repo = new FakeRepo();
    await expect(submit(repo, { status: "declined", attendeeCount: 0 })).resolves.toEqual({
      status: "declined",
      attendeeCount: 0,
    });
    expect(repo.docs[0]).toMatchObject({ status: "declined", attendeeCount: 0 });
    const error = await appError(submit(new FakeRepo(), { status: "declined", attendeeCount: 2 }));
    expect([error.status, error.code]).toEqual([400, "VALIDATION_ERROR"]);
  });
});

describe("submitRsvp: stored document", () => {
  it("stores the derived guest type, canonical key and pending sheet status, and never the invite", async () => {
    const repo = new FakeRepo();
    await submit(repo, { invite: INVITE, attendeeCount: 6, familyGroupName: "  the  AHMAD family " });
    const doc = repo.docs[0];
    expect(doc).toEqual({
      familyGroupName: "the AHMAD family",
      canonicalGroupKey: "the ahmad family",
      status: "attending",
      attendeeCount: 6,
      guestType: "internal",
      createdAt: BEFORE_DEADLINE,
      sheetStatus: "pending",
    });
    expect(JSON.stringify(doc)).not.toContain(INVITE);
  });

  it("derives external for a missing invite", async () => {
    const repo = new FakeRepo();
    await submit(repo);
    expect(repo.docs[0]?.guestType).toBe("external");
  });
});

describe("submitRsvp: deadline", () => {
  it("accepts up to and including the deadline instant", async () => {
    const at = new Date(Date.parse(RSVP_DEADLINE));
    await expect(submit(new FakeRepo(), {}, at)).resolves.toBeDefined();
  });

  it("rejects after the deadline with RSVP_CLOSED, before any limit or duplicate check", async () => {
    const repo = new FakeRepo();
    const after = new Date(Date.parse(RSVP_DEADLINE) + 1);
    const error = await appError(submit(repo, { attendeeCount: 99 }, after));
    expect([error.status, error.code]).toEqual([409, "RSVP_CLOSED"]);
    expect(repo.docs).toHaveLength(0);
  });
});

describe("submitRsvp: duplicates", () => {
  it("rejects a canonically equal family with a neutral message and keeps the first response", async () => {
    const repo = new FakeRepo();
    await submit(repo, { attendeeCount: 2 });
    const error = await appError(submit(repo, { familyGroupName: "  the ahmad   FAMILY", attendeeCount: 0, status: "declined" }));
    expect([error.status, error.code]).toEqual([409, "RSVP_DUPLICATE"]);
    expect(error.message).toBe("An RSVP for this family/group has already been received.");
    expect(error.message).not.toMatch(/\d/);
    expect(repo.docs).toHaveLength(1);
    expect(repo.docs[0]).toMatchObject({ status: "attending", attendeeCount: 2 });
  });

  it("does not treat a different guest type as a different family", async () => {
    const repo = new FakeRepo();
    await submit(repo);
    const error = await appError(submit(repo, { invite: INVITE }));
    expect(error.code).toBe("RSVP_DUPLICATE");
  });

  it("lets unexpected repository errors propagate (they become a generic 500 at the route)", async () => {
    const broken: RsvpRepository = { insert: () => Promise.reject(new Error("connection refused: mongodb://secret")) };
    await expect(submitRsvp(input(), { repo: broken, inviteCode: INVITE, now: BEFORE_DEADLINE })).rejects.toThrow(
      "connection refused",
    );
  });
});

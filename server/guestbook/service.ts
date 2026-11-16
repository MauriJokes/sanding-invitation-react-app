import type { ObjectId } from "mongodb";
import type { GuestbookDocument } from "../db/collections.js";
import { AppError } from "../http/errors.js";
import type { GuestbookPage, GuestbookSubmitted } from "../../shared/guestbook/constants.js";
import type { GuestbookQuery, GuestbookRequest } from "../../shared/guestbook/schemas.js";
import type { GuestbookRepository } from "./repository.js";

export interface SubmitDeps {
  repo: GuestbookRepository;
  now: Date;
  /** Runs after the insert succeeded (the Sheets write-through). Must not throw. */
  afterInsert?: (id: ObjectId, doc: GuestbookDocument) => Promise<unknown>;
}

export async function submitGuestbookEntry(input: GuestbookRequest, deps: SubmitDeps): Promise<GuestbookSubmitted> {
  // A real guest never sees this field. The error names nothing, so a bot learns nothing.
  if ((input.homepage ?? "").trim() !== "") {
    throw new AppError("VALIDATION_ERROR", 400, "Please check your responses.");
  }

  const isPublic = input.anonymous !== true;
  const doc: GuestbookDocument = {
    displayName: input.displayName,
    message: input.message,
    isPublic,
    createdAt: deps.now,
    sheetStatus: "pending",
  };
  const id = await deps.repo.insert(doc);
  await deps.afterInsert?.(id, doc);
  return { published: isPublic };
}

/** Only `displayName`, `message` and `createdAt` of public entries ever leave the server. */
export async function listGuestbook(query: GuestbookQuery, deps: { repo: GuestbookRepository }): Promise<GuestbookPage> {
  let before: { createdAtMs: number; id: string } | undefined;
  if (query.cursor) {
    const [ms = "", id = ""] = query.cursor.split("_");
    before = { createdAtMs: Number(ms), id };
  }

  // One extra row tells us whether another page exists.
  const rows = await deps.repo.listPublic({ limit: query.limit + 1, ...(before ? { before } : {}) });
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    entries: page.map((row) => ({ displayName: row.displayName, message: row.message, createdAt: row.createdAt.toISOString() })),
    nextCursor: rows.length > query.limit && last ? `${last.createdAt.getTime()}_${last.id.toHexString()}` : null,
  };
}

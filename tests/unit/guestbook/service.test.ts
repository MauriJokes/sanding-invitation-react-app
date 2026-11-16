import { ObjectId } from "mongodb";
import { describe, expect, it, vi } from "vitest";
import type { GuestbookDocument } from "../../../server/db/collections";
import { AppError } from "../../../server/http/errors";
import type {
  GuestbookRepository,
  PublicRow,
} from "../../../server/guestbook/repository";
import {
  listGuestbook,
  submitGuestbookEntry,
} from "../../../server/guestbook/service";
import { guestbookRequestSchema } from "../../../shared/guestbook/schemas";

const NOW = new Date("2026-12-01T10:00:00Z");

class FakeRepo implements GuestbookRepository {
  readonly docs: (Omit<GuestbookDocument, "_id"> & { _id: ObjectId })[] = [];
  insert(doc: Omit<GuestbookDocument, "_id">): Promise<ObjectId> {
    const _id = new ObjectId();
    this.docs.push({ ...doc, _id });
    return Promise.resolve(_id);
  }
  listPublic({
    limit,
    before,
  }: {
    limit: number;
    before?: { createdAtMs: number; id: string };
  }): Promise<PublicRow[]> {
    const rows = this.docs
      .filter((d) => d.isPublic)
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b._id.toHexString().localeCompare(a._id.toHexString()),
      )
      .filter(
        (d) =>
          !before ||
          d.createdAt.getTime() < before.createdAtMs ||
          (d.createdAt.getTime() === before.createdAtMs &&
            d._id.toHexString() < before.id),
      );
    return Promise.resolve(
      rows
        .slice(0, limit)
        .map((d) => ({
          id: d._id,
          displayName: d.displayName ?? "",
          message: d.message,
          createdAt: d.createdAt,
        })),
    );
  }
}

const entry = (over: Record<string, unknown> = {}) =>
  guestbookRequestSchema.parse({
    displayName: "Aisyah",
    message: "Selamat!",
    ...over,
  });

describe("submitGuestbookEntry: who may be shown", () => {
  it("publishes a named entry", async () => {
    const repo = new FakeRepo();
    await expect(
      submitGuestbookEntry(entry(), { repo, now: NOW }),
    ).resolves.toEqual({ published: true });
    expect(repo.docs[0]).toMatchObject({
      displayName: "Aisyah",
      message: "Selamat!",
      isPublic: true,
      sheetStatus: "pending",
      createdAt: NOW,
    });
  });

  it("keeps a named entry private when 'send anonymously' is chosen, but still stores the name for the couple", async () => {
    const repo = new FakeRepo();
    await expect(
      submitGuestbookEntry(entry({ anonymous: true }), { repo, now: NOW }),
    ).resolves.toEqual({ published: false });
    expect(repo.docs[0]).toMatchObject({
      displayName: "Aisyah",
      isPublic: false,
    });
  });

  it("treats anonymous: false like absent", async () => {
    const repo = new FakeRepo();
    await expect(
      submitGuestbookEntry(entry({ anonymous: false }), { repo, now: NOW }),
    ).resolves.toEqual({ published: true });
  });
});

describe("submitGuestbookEntry: honeypot", () => {
  it.each(["http://spam.example", "x", "  y  "])(
    "rejects a filled honeypot (%j), stores and mirrors nothing, names no field",
    async (value) => {
      const repo = new FakeRepo();
      const afterInsert = vi.fn();
      const error = await submitGuestbookEntry(entry({ homepage: value }), {
        repo,
        now: NOW,
        afterInsert,
      }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(400);
      expect((error as AppError).fields).toBeUndefined();
      expect(repo.docs).toHaveLength(0);
      expect(afterInsert).not.toHaveBeenCalled();
    },
  );

  it("accepts an empty or blank honeypot", async () => {
    for (const homepage of ["", "   ", undefined]) {
      await expect(
        submitGuestbookEntry(entry({ homepage }), {
          repo: new FakeRepo(),
          now: NOW,
        }),
      ).resolves.toEqual({ published: true });
    }
  });
});

describe("submitGuestbookEntry: write-through hook", () => {
  it("runs once after the insert with the new id and the stored document", async () => {
    const repo = new FakeRepo();
    const afterInsert = vi.fn(() => Promise.resolve());
    await submitGuestbookEntry(entry(), { repo, now: NOW, afterInsert });
    expect(afterInsert).toHaveBeenCalledTimes(1);
    const [id, doc] = afterInsert.mock.calls[0] as unknown as [
      ObjectId,
      GuestbookDocument,
    ];
    expect(id).toEqual(repo.docs[0]?._id);
    expect(doc).toMatchObject({ message: "Selamat!", isPublic: true });
  });

  it("does not run when the insert fails", async () => {
    const repo: GuestbookRepository = {
      insert: () => Promise.reject(new Error("db down")),
      listPublic: () => Promise.resolve([]),
    };
    const afterInsert = vi.fn();
    await expect(
      submitGuestbookEntry(entry(), { repo, now: NOW, afterInsert }),
    ).rejects.toThrow("db down");
    expect(afterInsert).not.toHaveBeenCalled();
  });
});

describe("listGuestbook", () => {
  async function seeded(count: number, tiedAt?: Date) {
    const repo = new FakeRepo();
    for (let i = 0; i < count; i++) {
      await submitGuestbookEntry(
        entry({ displayName: `Guest ${i}`, message: `Message ${i}` }),
        {
          repo,
          now: tiedAt ?? new Date(NOW.getTime() + i * 1000),
        },
      );
    }
    await submitGuestbookEntry(
      entry({
        displayName: "Shy Guest",
        anonymous: true,
        message: "private one",
      }),
      {
        repo,
        now: new Date(NOW.getTime() + 999_000),
      },
    );
    await submitGuestbookEntry(
      entry({ anonymous: true, message: "private two" }),
      { repo, now: new Date(NOW.getTime() + 999_500) },
    );
    return repo;
  }

  async function readAll(repo: FakeRepo, limit: number) {
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let pages = 0; pages < 100; pages++) {
      const page = await listGuestbook(
        { limit, ...(cursor ? { cursor } : {}) },
        { repo },
      );
      seen.push(...page.entries.map((e) => e.message));
      if (page.nextCursor === null) return { seen, pages: pages + 1 };
      cursor = page.nextCursor;
    }
    throw new Error("pagination did not end");
  }

  it("returns an empty page and no cursor when there is nothing public", async () => {
    expect(
      await listGuestbook({ limit: 20 }, { repo: new FakeRepo() }),
    ).toEqual({ entries: [], nextCursor: null });
  });

  it("returns only name, message and time, newest first, and never a private entry", async () => {
    const page = await listGuestbook({ limit: 20 }, { repo: await seeded(3) });
    expect(page.entries.map((e) => e.message)).toEqual([
      "Message 2",
      "Message 1",
      "Message 0",
    ]);
    expect(Object.keys(page.entries[0] ?? {}).sort()).toEqual([
      "createdAt",
      "displayName",
      "message",
    ]);
    expect(JSON.stringify(page)).not.toMatch(/private/);
  });

  it.each([
    ["exactly one page", 5, 5, 1],
    ["one more than a page", 6, 5, 2],
    ["several pages", 11, 3, 4],
    ["a page of one", 4, 1, 4],
  ])(
    "pages through %s without gaps or repeats",
    async (_name, total, limit, pages) => {
      const repo = await seeded(total);
      const { seen, pages: used } = await readAll(repo, limit);
      expect(used).toBe(pages);
      expect(seen).toEqual(
        Array.from({ length: total }, (_, i) => `Message ${total - 1 - i}`),
      );
    },
  );

  it("gives no cursor when the last page is exactly full", async () => {
    const page = await listGuestbook({ limit: 5 }, { repo: await seeded(5) });
    expect(page.entries).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
  });

  it("does not skip or repeat entries that share the same timestamp", async () => {
    const repo = await seeded(9, NOW);
    const { seen } = await readAll(repo, 2);
    expect(new Set(seen).size).toBe(9);
    expect(seen).toHaveLength(9);
  });
});

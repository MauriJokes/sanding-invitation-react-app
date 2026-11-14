import type { Db } from "mongodb";
import { loadEnv } from "vite";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { closeDb, getDb } from "../../server/db/client";
import { COLLECTIONS } from "../../server/db/collections";
import { ensureIndexes } from "../../server/db/indexes";

export const TEST_INVITE = "k7Qm2-xV9pLr4TnB8wZc_Hd3";
export const TEST_SALT = "integration-test-salt-0123456789abcdef";

/**
 * Integration tests need MONGODB_URI and MONGODB_TEST_DATABASE (from the shell or .env.local).
 * They fail loudly when missing, and refuse any database that is not clearly a throwaway test one.
 */
function readConfig() {
  const env = { ...loadEnv("test", process.cwd(), ""), ...process.env };
  const uri = env.MONGODB_URI;
  const database = env.MONGODB_TEST_DATABASE;
  if (!uri || !database) {
    throw new Error("Integration tests need MONGODB_URI and MONGODB_TEST_DATABASE (see .env.example).");
  }
  if (!/test/i.test(database)) {
    throw new Error("MONGODB_TEST_DATABASE must contain 'test'. Tests wipe the collections they use.");
  }
  if (database === env.MONGODB_DATABASE) {
    throw new Error("MONGODB_TEST_DATABASE must differ from MONGODB_DATABASE.");
  }
  return { uri, database };
}

/** Points the app at the test database, applies the real index definitions and empties collections before each test. */
export function useTestDatabase(): { db: () => Promise<Db> } {
  beforeAll(async () => {
    const { uri, database } = readConfig();
    vi.stubEnv("MONGODB_URI", uri);
    vi.stubEnv("MONGODB_DATABASE", database);
    vi.stubEnv("INTERNAL_INVITE_CODE", TEST_INVITE);
    vi.stubEnv("RATE_LIMIT_SALT", TEST_SALT);
    await ensureIndexes(await getDb());
  });

  beforeEach(async () => {
    const db = await getDb();
    await Promise.all(Object.values(COLLECTIONS).map((name) => db.collection(name).deleteMany({})));
  });

  afterAll(async () => {
    await closeDb();
    vi.unstubAllEnvs();
  });

  return { db: getDb };
}

let ipCounter = 0;
/** A fresh client IP per call so tests do not share rate-limit buckets by accident. */
export const freshIp = () => `198.51.100.${(++ipCounter % 250) + 1}-t${ipCounter}`;

export function postJson(
  route: { fetch(request: Request): Promise<Response> },
  body: unknown,
  ip: string = freshIp(),
  path = "/api/rsvp",
): Promise<Response> {
  return route.fetch(
    new Request(`https://example.test${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": ip },
      body: JSON.stringify(body),
    }),
  );
}

export interface ApiBody {
  data: Record<string, unknown> | null;
  error: { code: string; message: string; fields?: string[] } | null;
}

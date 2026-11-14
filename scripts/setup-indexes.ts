import { closeDb, getDb } from "../server/db/client.js";
import { ensureIndexes } from "../server/db/indexes.js";

/** Usage: npm run db:indexes (reads MONGODB_URI and MONGODB_DATABASE from the environment or .env.local). */
async function main() {
  const db = await getDb();
  await ensureIndexes(db);
  for (const name of ["rsvps", "rateLimits"]) {
    const indexes = await db.collection(name).indexes();
    console.log(`${db.databaseName}.${name}: ${indexes.map((index) => index.name).join(", ")}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(`Index setup failed: ${error instanceof Error ? error.name : "unknown error"}`);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

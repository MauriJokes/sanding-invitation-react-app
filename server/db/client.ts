import { MongoClient, type Db } from "mongodb";
import { getDatabaseEnv } from "../config/env.js";

let clientPromise: Promise<MongoClient> | undefined;

function connect(): Promise<MongoClient> {
  const { MONGODB_URI } = getDatabaseEnv();
  const client = new MongoClient(MONGODB_URI, {
    appName: "sanding-invitation",
    maxPoolSize: 5,
    // Short idle timeout so suspended function instances do not hold Atlas connections (Vercel guidance).
    maxIdleTimeMS: 5000,
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10_000,
  });
  return client.connect();
}

/** One client per warm function instance. A failed connect is not cached, so the next request retries. */
export function getClient(): Promise<MongoClient> {
  clientPromise ??= connect().catch((error: unknown) => {
    clientPromise = undefined;
    throw error;
  });
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getDatabaseEnv().MONGODB_DATABASE);
}

export async function closeDb(): Promise<void> {
  const pending = clientPromise;
  clientPromise = undefined;
  if (pending) await (await pending).close();
}

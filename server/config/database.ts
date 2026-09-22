import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";
import type { AppEnv } from "./env";

let client: MongoClient | undefined;
let database: Db | undefined;

export async function connectDatabase(env: AppEnv): Promise<Db> {
  if (database) return database;
  try {
    client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("queryTxt") || message.includes("ESERVFAIL") || message.includes("ENOTFOUND")) {
      try {
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
      } catch (retryError) {
        client = undefined;
        throw retryError;
      }
    } else {
      client = undefined;
      throw error;
    }
  }
  database = client.db(env.MONGODB_DATABASE);
  await database.collection("reminders").createIndex({ scheduledAt: 1, status: 1 });
  await database.collection("conversations").createIndex({ updatedAt: -1 });
  return database;
}

export function getDatabase(): Db {
  if (!database) throw new Error("Database is not connected");
  return database;
}

export function isDatabaseConnected() {
  return Boolean(database);
}

export async function closeDatabase() {
  await client?.close();
  client = undefined;
  database = undefined;
}

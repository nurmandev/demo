import { MongoClient, type Db } from "mongodb";
import type { AppEnv } from "./env";

let client: MongoClient | undefined;
let database: Db | undefined;

export async function connectDatabase(env: AppEnv): Promise<Db> {
  if (database) return database;
  client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
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

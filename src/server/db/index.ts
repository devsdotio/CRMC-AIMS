import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __crmcDb?: Database;
  __crmcPg?: ReturnType<typeof postgres>;
};

/**
 * Lazy Drizzle client. Avoids crashing module evaluation during Next.js
 * builds that import route handlers without a live DATABASE_URL.
 */
export function getDb(): Database {
  if (globalForDb.__crmcDb) {
    return globalForDb.__crmcDb;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment (.env / .env.local)."
    );
  }

  /**
   * Small pool: Next route handlers share the process; transactions need headroom.
   * In development, Next.js spawns multiple workers which can quickly exhaust 
   * the Supabase pooler limit if max is too high.
   * keepAlive + connect_timeout avoid hung statements on flaky network to Supabase.
   */
  const client = postgres(connectionString, {
    max: process.env.NODE_ENV === "development" ? 2 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });
  const db = drizzle(client, { schema });

  globalForDb.__crmcPg = client;
  globalForDb.__crmcDb = db;

  return db;
}

/** Convenience re-export for modules that prefer a named `db` getter. */
export const db = {
  get client(): Database {
    return getDb();
  },
};

export { schema };

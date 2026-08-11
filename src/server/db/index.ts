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
   * Shared process pool. Too few connections + heavy parallel queries (old
   * full-dashboard-from-layout) caused hung API routes and infinite skeletons.
   * statement_timeout fails slow queries so the pool is not held for minutes.
   */
  const client = postgres(connectionString, {
    max: process.env.NODE_ENV === "development" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    connection: {
      // ms — abort long statements so waiters can acquire a connection
      statement_timeout: 12_000,
    },
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

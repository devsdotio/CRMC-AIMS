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
   * Shared process pool. Slow remote DB + many parallel APIs exhaust small pools
   * and leave list pages spinning on skeletons.
   *
   * `options` sets Postgres GUCs for every session (statement_timeout aborts
   * hung statements so pool slots free up).
   */
  const client = postgres(connectionString, {
    max: process.env.NODE_ENV === "development" ? 8 : 12,
    idle_timeout: 20,
    connect_timeout: 8,
    prepare: false,
    // Fail long queries (~8s) instead of holding pool slots for 25s+
    connection: {
      statement_timeout: 8000,
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

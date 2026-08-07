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
   * `max: 1` is a safe default for serverless / Next.js route handlers.
   * Raise it when running as a long-lived Node process.
   */
  const client = postgres(connectionString, { max: 1 });
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

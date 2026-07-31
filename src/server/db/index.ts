import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your environment (.env / .env.local)."
  );
}

/**
 * A single shared postgres-js client for the whole server runtime.
 *
 * `max: 1` is a safe default for serverless/edge-adjacent Next.js
 * deployments (e.g. Vercel) where each function instance should hold a
 * small connection footprint. Raise this if running as a long-lived
 * Node server.
 */
const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });

export { schema };

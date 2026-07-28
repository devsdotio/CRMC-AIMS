import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
	if (dbInstance) {
		return dbInstance;
	}

	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("DATABASE_URL is not configured.");
	}

	const queryClient = postgres(connectionString, {
		max: 1,
		prepare: false,
	});

	dbInstance = drizzle(queryClient, { schema });
	return dbInstance;
}

export type Db = ReturnType<typeof getDb>;

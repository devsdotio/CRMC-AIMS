import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isAppError } from "./errors";

/**
 * Success envelope used by the frontend assets client:
 * `src/features/assets/client/assets-api.ts` → `{ data: T }`.
 *
 * Keep this shape stable so hooks integrate without client changes.
 * Structured `success`/`code` can be layered on later without dropping `data`.
 */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Error envelope used by the frontend assets client → `{ error: string }`.
 */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message ?? "Invalid request data.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (isAppError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    { error: "An unexpected error occurred." },
    { status: 500 }
  );
}

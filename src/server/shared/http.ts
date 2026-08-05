import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "./errors";

/**
 * Standard success envelope used by every controller in every module.
 */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Standard error envelope. Controllers should funnel every caught error
 * through this so responses stay consistent across modules.
 */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data.",
          issues: error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  if (isAppError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  // Unexpected error — never leak internals to the client.
  console.error("Unhandled error:", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 }
  );
}

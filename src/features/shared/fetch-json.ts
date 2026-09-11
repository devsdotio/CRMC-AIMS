/**
 * Shared authenticated fetch for feature client APIs.
 * Response envelope: `{ data: T }` / error `{ error: string }`.
 */

type ApiResponse<T> = { data: T };
type PaginatedResponse<T> = {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts?: Record<string, number>;
  };
};
type ApiErrorResponse = { error?: string };

/** Client-side abort so a hung Next API / DB path cannot spin skeletons forever. */
const DEFAULT_TIMEOUT_MS = 25_000;

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { timeoutMs: _timeoutMs, signal: externalSignal, ...restInit } =
    init ?? {};
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onAbort);

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...restInit,
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(restInit.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const payload = (await response.json()) as ApiErrorResponse;
        if (payload.error) message = payload.error;
      } catch {
        // keep generic
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (response.status === 304) {
      try {
        return (await response.json()) as T;
      } catch {
        return undefined as T;
      }
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Request timed out. Check your connection or try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onAbort);
  }
}

export type { ApiResponse, PaginatedResponse };

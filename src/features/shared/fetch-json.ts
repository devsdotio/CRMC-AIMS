/**
 * Shared authenticated fetch for feature client APIs.
 * Response envelope: `{ data: T }` / error `{ error: string }`.
 */

type ApiResponse<T> = { data: T };
type ApiErrorResponse = { error?: string };

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
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

  return (await response.json()) as T;
}

export type { ApiResponse };

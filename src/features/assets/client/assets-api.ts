import type {
  Asset,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";

type ApiResponse<T> = { data: T };
type ApiErrorResponse = { error?: string };

/**
 * Thin fetch wrapper for authenticated same-origin `/api/assets` calls.
 * Cookies from Supabase SSR session are sent automatically (`same-origin`).
 * Not consumed by the assets page yet — reserved for React Query hooks.
 */
async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
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
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parsing errors to preserve generic message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const assetsApi = {
  async listAssets(status?: AssetStatus): Promise<Asset[]> {
    const searchParams = new URLSearchParams();

    if (status) {
      searchParams.set("status", status);
    }

    const queryString = searchParams.toString();
    const path = queryString.length > 0 ? `/api/assets?${queryString}` : "/api/assets";
    const response = await fetchJson<ApiResponse<Asset[]>>(path, { method: "GET" });
    return response.data;
  },

  async getAssetById(id: string): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>(`/api/assets/${id}`, { method: "GET" });
    return response.data;
  },

  async createAsset(payload: CreateAssetInput): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>("/api/assets", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  async updateAsset(id: string, payload: UpdateAssetInput): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>(`/api/assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  async deleteAsset(id: string): Promise<void> {
    await fetchJson<void>(`/api/assets/${id}`, { method: "DELETE" });
  },

  async releaseAsset(id: string): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>(`/api/assets/${id}/release`, {
      method: "POST",
    });

    return response.data;
  },

  async returnAsset(id: string, payload: ReturnAssetInput): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>(`/api/assets/${id}/return`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.data;
  },
};

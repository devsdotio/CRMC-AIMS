import type {
  Asset,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/types/assets";

export type AssetLifecycleEvent = {
  id: string;
  assetId: string | null;
  assetCode: string;
  eventType:
    | "created"
    | "updated"
    | "status_changed"
    | "released"
    | "returned"
    | "flagged_maintenance"
    | "deleted";
  actor: {
    userId: string;
    email: string | null;
    displayName: string;
  };
  fromStatus: string | null;
  toStatus: string | null;
  fromHolder: string | null;
  toHolder: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ReleaseAssetInput = {
  /** Required — anonymous checkout is not allowed for accountability. */
  borrowerName: string;
  borrowerDepartment?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  notes?: string;
  expectedReturnDate?: string;
  requestId?: string;
};

export type FlagMaintenanceInput = {
  description?: string;
  notes?: string;
};

type ApiResponse<T> = { data: T };
type ApiErrorResponse = { error?: string };

/**
 * Thin fetch wrapper for authenticated same-origin `/api/assets` calls.
 * Cookies from Supabase SSR session are sent automatically (`same-origin`).
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

  async releaseAsset(id: string, payload: ReleaseAssetInput): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>(`/api/assets/${id}/release`, {
      method: "POST",
      body: JSON.stringify(payload),
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

  async flagForMaintenance(id: string, payload: FlagMaintenanceInput = {}): Promise<Asset> {
    const response = await fetchJson<ApiResponse<Asset>>(
      `/api/assets/${id}/flag-maintenance`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    return response.data;
  },

  async listLifecycle(id: string, limit?: number): Promise<AssetLifecycleEvent[]> {
    const searchParams = new URLSearchParams();
    if (limit !== undefined) {
      searchParams.set("limit", String(limit));
    }
    const query = searchParams.toString();
    const path =
      query.length > 0
        ? `/api/assets/${id}/lifecycle?${query}`
        : `/api/assets/${id}/lifecycle`;
    const response = await fetchJson<ApiResponse<AssetLifecycleEvent[]>>(path, {
      method: "GET",
    });
    return response.data;
  },
};

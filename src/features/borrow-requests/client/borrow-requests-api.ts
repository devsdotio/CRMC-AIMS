import type { BorrowRequestDTO } from "@/server/modules/borrow-requests/borrow-request.types";
import { fetchJson, type ApiResponse, type PaginatedResponse } from "@/features/shared/fetch-json";

export type BorrowRequest = BorrowRequestDTO;

export type CreateBorrowRequestPayload = {
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  department: string;
  items: {
    itemDescription: string;
    assetId?: string;
    assetCode?: string;
    category: BorrowRequest["items"][number]["category"];
    quantity: number;
    itemType: "asset" | "consumable";
  }[];
  purpose: string;
  expectedReturnDate: string;
  notes?: string;
  requesterUserId?: string;
};

export type ApproveBorrowRequestPayload = {
  note?: string;
  assetId?: string;
  assetCode?: string;
};

export type ReleaseBorrowRequestPayload = {
  pickedUpBy: string;
  note?: string;
};

export const borrowRequestsApi = {
  async list(params?: {
    status?: BorrowRequest["status"];
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<BorrowRequest[]>> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.department) sp.set("department", params.department);
    if (params?.search) sp.set("search", params.search);
    if (params?.startDate) sp.set("startDate", params.startDate);
    if (params?.endDate) sp.set("endDate", params.endDate);
    if (params?.page) sp.set("page", params.page.toString());
    if (params?.limit) sp.set("limit", params.limit.toString());
    const qs = sp.toString();
    const res = await fetchJson<ApiResponse<PaginatedResponse<BorrowRequest[]>>>(
      qs ? `/api/borrow-requests?${qs}` : "/api/borrow-requests"
    );
    return res.data;
  },

  async getById(id: string): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      `/api/borrow-requests/${id}`
    );
    return res.data;
  },

  async create(payload: CreateBorrowRequestPayload): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      "/api/borrow-requests",
      { method: "POST", body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async approve(
    id: string,
    payload?: ApproveBorrowRequestPayload
  ): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      `/api/borrow-requests/${id}/approve`,
      { method: "POST", body: JSON.stringify(payload ?? {}) }
    );
    return res.data;
  },

  async reject(id: string, reason: string): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      `/api/borrow-requests/${id}/reject`,
      { method: "POST", body: JSON.stringify({ reason }) }
    );
    return res.data;
  },

  async release(id: string, payload: ReleaseBorrowRequestPayload): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      `/api/borrow-requests/${id}/release`,
      { method: "POST", body: JSON.stringify(payload ?? {}) }
    );
    return res.data;
  },

  async markUnreleased(id: string, payload?: { note?: string }): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      `/api/borrow-requests/${id}/unrelease`,
      { method: "POST", body: JSON.stringify(payload ?? {}) }
    );
    return res.data;
  },

  async markReturned(id: string, payload: { returnedBy: string; note?: string }): Promise<BorrowRequest> {
    const res = await fetchJson<ApiResponse<BorrowRequest>>(
      `/api/borrow-requests/${id}/return`,
      { method: "POST", body: JSON.stringify(payload ?? {}) }
    );
    return res.data;
  },
};

import type { BorrowRequestDTO } from "@/server/modules/borrow-requests/borrow-request.types";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type BorrowRequest = BorrowRequestDTO;

export type CreateBorrowRequestPayload = {
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  department: string;
  itemDescription: string;
  assetId?: string;
  assetCode?: string;
  category: BorrowRequest["category"];
  quantity?: number;
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

export const borrowRequestsApi = {
  async list(params?: {
    status?: BorrowRequest["status"];
    department?: string;
    search?: string;
  }): Promise<BorrowRequest[]> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.department) sp.set("department", params.department);
    if (params?.search) sp.set("search", params.search);
    const qs = sp.toString();
    const res = await fetchJson<ApiResponse<BorrowRequest[]>>(
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
};

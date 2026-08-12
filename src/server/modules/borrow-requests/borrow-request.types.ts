import type {
  BorrowRequestRow,
  BorrowRequestHistoryEntry,
} from "@/server/db/schema";

export type BorrowRequestDTO = {
  id: string;
  requestCode: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  department: string;
  itemDescription: string;
  assetCode?: string;
  category: string;
  quantity: number;
  purpose: string;
  requestedAt: string;
  relativeTime: string;
  expectedReturnDate: string;
  status: "pending" | "approved" | "rejected" | "released" | "unreleased" | "returned" | "cancelled";
  notes?: string;
  rejectionReason?: string;
  pickedUpBy?: string;
  history: BorrowRequestHistoryEntry[];
};

export type ListBorrowRequestFilters = {
  status?: BorrowRequestDTO["status"];
  department?: string;
  search?: string;
  requesterUserId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

export interface IBorrowRequestRepository {
  findById(id: string): Promise<BorrowRequestRow | null>;
  list(filters?: ListBorrowRequestFilters): Promise<BorrowRequestRow[]>;
  count(filters?: Omit<ListBorrowRequestFilters, "page" | "limit">): Promise<number>;
  countByStatus(filters?: Omit<ListBorrowRequestFilters, "status" | "page" | "limit">): Promise<Record<string, number>>;
  countAll(): Promise<number>;
  create(
    data: Omit<
      import("@/server/db/schema").NewBorrowRequestRow,
      "id" | "createdAt" | "updatedAt"
    >,
    session?: import("@/server/db/transaction").DbSession
  ): Promise<BorrowRequestRow>;
  update(
    id: string,
    data: Partial<
      Omit<BorrowRequestRow, "id" | "createdAt" | "requestCode">
    >,
    session?: import("@/server/db/transaction").DbSession
  ): Promise<BorrowRequestRow | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countPending(session?: any, userId?: string): Promise<number>;
}

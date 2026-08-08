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
  category: "transport" | "computing" | "av" | "furniture";
  quantity: number;
  purpose: string;
  requestedAt: string;
  relativeTime: string;
  expectedReturnDate: string;
  status: "pending" | "approved" | "rejected" | "returned";
  notes?: string;
  rejectionReason?: string;
  history: BorrowRequestHistoryEntry[];
};

export type ListBorrowRequestFilters = {
  status?: BorrowRequestDTO["status"];
  department?: string;
  search?: string;
};

export interface IBorrowRequestRepository {
  findById(id: string): Promise<BorrowRequestRow | null>;
  list(filters?: ListBorrowRequestFilters): Promise<BorrowRequestRow[]>;
  countAll(): Promise<number>;
  create(
    data: Omit<
      import("@/server/db/schema").NewBorrowRequestRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<BorrowRequestRow>;
  update(
    id: string,
    data: Partial<
      Omit<BorrowRequestRow, "id" | "createdAt" | "requestCode">
    >
  ): Promise<BorrowRequestRow | null>;
  countPending(): Promise<number>;
}

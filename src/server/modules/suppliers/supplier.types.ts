import type { SupplierRow } from "@/server/db/schema";

export type SupplierStatus = "active" | "inactive";

export type SupplierDTO = {
  id: string;
  supplierCode: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  notes: string | null;
  status: SupplierStatus;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type ListSupplierFilters = {
  search?: string;
  status?: SupplierStatus;
  activeOnly?: boolean;
};

export interface ISupplierRepository {
  findById(id: string): Promise<SupplierRow | null>;
  list(filters?: ListSupplierFilters): Promise<SupplierRow[]>;
  create(
    data: Omit<
      import("@/server/db/schema").NewSupplierRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<SupplierRow>;
  update(
    id: string,
    data: Partial<Omit<SupplierRow, "id" | "createdAt" | "supplierCode">>
  ): Promise<SupplierRow | null>;
}

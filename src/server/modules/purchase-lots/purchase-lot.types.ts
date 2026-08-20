import type { PurchaseLotRow } from "@/server/db/schema";

export type PurchaseLotItemType = "consumable" | "asset";

export type PurchaseLotDTO = {
  id: string;
  poNumber: string;
  lotCode: string;
  itemType: PurchaseLotItemType;
  consumableId: string | null;
  assetId: string | null;
  itemCode: string;
  itemName: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  quantityRemaining: number;
  unitCost: string;
  totalCost: string;
  purchasedOn: string;
  reference: string | null;
  notes: string | null;
  recordedByUserId: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
  /** Print/scan payload: `CRMC-AIMS-LOT:{lotCode}` */
  qrPayload: string;
};

export type ListPurchaseLotFilters = {
  consumableId?: string;
  assetId?: string;
  supplierId?: string;
  itemType?: PurchaseLotItemType;
  search?: string;
};

export type CreatePurchaseLotInput = {
  itemType: PurchaseLotItemType;
  consumableId?: string | null;
  assetId?: string | null;
  itemCode: string;
  itemName: string;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity: number;
  unitCost: string;
  purchasedOn: string;
  reference?: string | null;
  notes?: string | null;
  recordedByUserId: string;
  recordedByName: string;
};

export interface IPurchaseLotRepository {
  findById(id: string): Promise<PurchaseLotRow | null>;
  list(filters?: ListPurchaseLotFilters): Promise<PurchaseLotRow[]>;
  create(
    data: Omit<
      import("@/server/db/schema").NewPurchaseLotRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<PurchaseLotRow>;
}

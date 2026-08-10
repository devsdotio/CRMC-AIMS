export type PurchaseLotItemType = "consumable" | "asset";

export interface PurchaseLot {
  id: string;
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
  /** Canonical QR payload for physical batch tags: `CRMC-AIMS-LOT:{lotCode}` */
  qrPayload?: string;
}

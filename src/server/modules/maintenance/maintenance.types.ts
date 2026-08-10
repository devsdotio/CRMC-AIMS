import type { MaintenanceLogRow } from "@/server/db/schema";

export type MaintenanceLogDTO = {
  id: string;
  logCode: string;
  assetCode: string;
  assetName: string;
  category: string;
  condition: "good" | "needs_maintenance" | "damaged" | "resolved";
  source: "return_checkout" | "manual_flag" | "project_assignment";
  dateLogged: string;
  loggedBy: string;
  notes: string;
  isResolved: boolean;
  resolutionDate?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  relatedBorrowLogCode?: string;
  scheduledDate?: string;
};

export type ListMaintenanceFilters = {
  openOnly?: boolean;
  search?: string;
  condition?: MaintenanceLogDTO["condition"];
};

export interface IMaintenanceRepository {
  findById(id: string): Promise<MaintenanceLogRow | null>;
  list(filters?: ListMaintenanceFilters): Promise<MaintenanceLogRow[]>;
  countOpen(): Promise<number>;
  countYear(): Promise<number>;
  create(
    data: Omit<
      import("@/server/db/schema").NewMaintenanceLogRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<MaintenanceLogRow>;
  update(
    id: string,
    data: Partial<Omit<MaintenanceLogRow, "id" | "createdAt" | "logCode">>
  ): Promise<MaintenanceLogRow | null>;
}

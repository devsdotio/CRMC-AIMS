import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";
import type { AuditLogRow } from "@/server/db/schema/audit-logs";

export type AuditLogRecord = AuditLogRow;

export const auditLogsApi = {
  async list(params?: {
    entityType?: string;
    entityId?: string;
    actorUserId?: string;
    action?: string;
  }): Promise<AuditLogRecord[]> {
    const sp = new URLSearchParams();
    if (params?.entityType) sp.set("entityType", params.entityType);
    if (params?.entityId) sp.set("entityId", params.entityId);
    if (params?.actorUserId) sp.set("actorUserId", params.actorUserId);
    if (params?.action) sp.set("action", params.action);
    
    const qs = sp.toString();
    const res = await fetchJson<ApiResponse<AuditLogRecord[]>>(
      qs ? `/api/audit-logs?${qs}` : "/api/audit-logs"
    );
    return res.data;
  },
};

"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { auditLogsApi, type AuditLogRecord } from "./audit-logs-api";
import { auditLogQueryKeys } from "./query-keys";

export function useAuditLogsQuery(filters?: {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: string;
}): UseQueryResult<AuditLogRecord[], Error> {
  return useQuery({
    queryKey: auditLogQueryKeys.list(filters),
    queryFn: () => auditLogsApi.list(filters),
  });
}

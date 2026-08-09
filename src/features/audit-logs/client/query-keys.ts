export const auditLogQueryKeys = {
  all: ["audit-logs"] as const,
  list: (filters?: Record<string, any>) =>
    [...auditLogQueryKeys.all, "list", filters] as const,
};

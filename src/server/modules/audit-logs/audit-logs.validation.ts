import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
  actorUserId: z.string().uuid().optional(),
  action: z.string().trim().max(100).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

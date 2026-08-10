import type { ActorContext } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import { ForbiddenError } from "@/server/shared/errors";
import { AuditLogRepository } from "./audit-logs.repository";
import { listAuditLogsQuerySchema, type ListAuditLogsQuery } from "./audit-logs.validation";
import type { AuditLogRow } from "@/server/db/schema/audit-logs";

export class AuditLogService {
  constructor(private readonly repo = new AuditLogRepository()) {}

  async list(rawQuery: unknown, actor: ActorContext): Promise<AuditLogRow[]> {
    const filters = listAuditLogsQuerySchema.parse(rawQuery ?? {});
    
    // Borrowers can only view their own actions (unless they are querying a specific entity they own, 
    // but for now, enforce actorUserId to be their own for generic queries).
    if (!isAssetOperatorRole(actor.role)) {
      if (filters.actorUserId && filters.actorUserId !== actor.userId) {
        throw new ForbiddenError("You can only view your own audit logs.");
      }
      filters.actorUserId = actor.userId;
    }

    return this.repo.list(filters);
  }
}

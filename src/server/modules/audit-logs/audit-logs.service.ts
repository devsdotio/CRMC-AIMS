import type { ActorContext } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import { ForbiddenError } from "@/server/shared/errors";
import { AuditLogRepository } from "./audit-logs.repository";
import { listAuditLogsQuerySchema, type ListAuditLogsQuery } from "./audit-logs.validation";
import type { AuditLogRow } from "@/server/db/schema/audit-logs";
import { getDb } from "@/server/db";
import { borrowRequests, consumableRequests } from "@/server/db/schema";
import { inArray } from "drizzle-orm";

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

    const logs = await this.repo.list(filters);

    // Enrich entityId with requestCodes for borrow and consumable requests
    const borrowRequestIds = Array.from(new Set(logs.filter(l => l.entityType === 'borrow_request').map(l => l.entityId)));
    const consumableRequestIds = Array.from(new Set(logs.filter(l => l.entityType === 'consumable_request').map(l => l.entityId)));

    const db = getDb();
    
    const codeMap = new Map<string, string>();

    if (borrowRequestIds.length > 0) {
      const borrows = await db.select({ id: borrowRequests.id, code: borrowRequests.requestCode }).from(borrowRequests).where(inArray(borrowRequests.id, borrowRequestIds));
      for (const b of borrows) codeMap.set(b.id, b.code);
    }

    if (consumableRequestIds.length > 0) {
      const consumables = await db.select({ id: consumableRequests.id, code: consumableRequests.requestCode }).from(consumableRequests).where(inArray(consumableRequests.id, consumableRequestIds));
      for (const c of consumables) codeMap.set(c.id, c.code);
    }

    return logs.map(log => {
      if (codeMap.has(log.entityId)) {
        return { ...log, entityId: codeMap.get(log.entityId)! };
      }
      return log;
    });
  }
}

import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AuditLogCursor } from "./audit-log-cursor.service";
import type { AuditLogScope } from "./audit-log-scope.service";

type AuditLogQueryFilters = {
  action?: string;
  actorUserId?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  to?: string;
};

type BuildAuditLogQueryInput = {
  cursor: AuditLogCursor | null;
  filters: AuditLogQueryFilters;
  organizationId: string;
  scopedFilters: AuditLogScope;
};

@Injectable()
export class AuditLogQueryService {
  build({ organizationId, filters, scopedFilters, cursor }: BuildAuditLogQueryInput) {
    return {
      organizationId,
      ...(scopedFilters.projectId ? { projectId: scopedFilters.projectId } : {}),
      ...(scopedFilters.configId ? { configId: scopedFilters.configId } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: new Date(cursor.createdAt) } },
              { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
            ],
          }
        : {}),
    } satisfies Prisma.AuditLogWhereInput;
  }
}

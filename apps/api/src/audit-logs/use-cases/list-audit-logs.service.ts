import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditLogCursorService, AuditLogQueryService, AuditLogScopeService } from "../support";

export type AuditLogFilters = {
  action?: string;
  actorUserId?: string;
  configId?: string;
  cursor?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  limit?: number;
  projectId?: string;
  to?: string;
};

type ListAuditLogsInput = {
  filters: AuditLogFilters;
  organizationId: string;
  userId: string;
};

@Injectable()
export class ListAuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: AuditLogScopeService,
    private readonly cursor: AuditLogCursorService,
    private readonly query: AuditLogQueryService,
  ) {}

  async execute({ userId, organizationId, filters }: ListAuditLogsInput) {
    const scopedFilters = await this.scope.resolve(userId, organizationId, filters);
    const limit = filters.limit ?? 50;
    const cursor = filters.cursor ? this.cursor.decode(filters.cursor) : null;
    const where = this.query.build({ organizationId, filters, scopedFilters, cursor });

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            email: true,
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const items = logs.slice(0, limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: logs.length > limit && lastItem ? this.cursor.encode(lastItem) : null,
    };
  }
}

import { Injectable } from "@nestjs/common";
import { type AuditLogFilters, ListAuditLogsService } from "./use-cases";

@Injectable()
export class AuditLogsService {
  constructor(private readonly listAuditLogs: ListAuditLogsService) {}

  async list(userId: string, organizationId: string, filters: AuditLogFilters) {
    return this.listAuditLogs.execute({ userId, organizationId, filters });
  }
}

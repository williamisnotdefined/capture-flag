import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { ListAuditLogsQueryDto } from "../common/dtos";
import { AuditLogsService } from "./audit-logs.service";

@Controller("api/v1")
@UseGuards(SessionGuard)
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get("organizations/:organizationId/audit-logs")
  list(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Query() query: ListAuditLogsQueryDto,
  ) {
    return this.auditLogs.list(request.user.id, organizationId, query);
  }
}

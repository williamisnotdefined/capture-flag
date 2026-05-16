import { Get, Query } from "@nestjs/common";
import { SessionApiController } from "../auth/session-api-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { AuditLogsService } from "./audit-logs.service";
import { ListAuditLogsQueryDto } from "./dto";

@SessionApiController("api/v1")
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get("organizations/:organizationId/audit-logs")
  list(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
    @Query() query: ListAuditLogsQueryDto,
  ) {
    return this.auditLogs.list(userId, organizationId, query);
  }
}

import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLogCursorService, AuditLogQueryService, AuditLogScopeService } from "./support";
import { ListAuditLogsService } from "./use-cases";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    ListAuditLogsService,
    AuditLogScopeService,
    AuditLogCursorService,
    AuditLogQueryService,
  ],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}

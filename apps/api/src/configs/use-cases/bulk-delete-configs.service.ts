import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigAccessService, ConfigAuditService } from "../support";

export type BulkDeleteConfigsInput = {
  configIds: string[];
  projectId: string;
  userId: string;
};

@Injectable()
export class BulkDeleteConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configAccess: ConfigAccessService,
    private readonly configAudit: ConfigAuditService,
  ) {}

  async execute({ userId, projectId, configIds }: BulkDeleteConfigsInput) {
    const access = await this.configAccess.requireProjectManager(userId, projectId);
    const configs = await this.prisma.config.findMany({
      where: { id: { in: configIds }, projectId },
    });

    if (configs.length !== configIds.length) {
      throw new NotFoundException("Config not found");
    }

    const configCount = await this.prisma.config.count({ where: { projectId } });
    if (configCount - configIds.length < 1) {
      throw new BadRequestException("The last config of a project cannot be deleted");
    }

    const auditLogCount = await this.prisma.auditLog.count({
      where: { configId: { in: configIds } },
    });
    if (auditLogCount > 0) {
      throw new BadRequestException("Config has audit history and cannot be hard deleted");
    }

    await this.prisma.$transaction(async (tx) => {
      for (const config of configs) {
        await this.configAudit.createConfigDeletedLog(tx, {
          actorUserId: userId,
          config,
          organizationId: access.project.organizationId,
          projectId,
        });
      }

      const deleteResult = await tx.config.deleteMany({
        where: { id: { in: configIds }, projectId },
      });

      if (deleteResult.count !== configIds.length) {
        throw new NotFoundException("Config not found");
      }
    });

    return { ok: true, count: configIds.length };
  }
}

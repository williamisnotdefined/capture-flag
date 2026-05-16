import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigAccessService, ConfigAuditService } from "../support";

export type DeleteConfigInput = {
  configId: string;
  userId: string;
};

@Injectable()
export class DeleteConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configAccess: ConfigAccessService,
    private readonly configAudit: ConfigAuditService,
  ) {}

  async execute({ userId, configId }: DeleteConfigInput) {
    const config = await this.configAccess.findConfigForDelete(userId, configId);

    const configCount = await this.prisma.config.count({
      where: { projectId: config.projectId },
    });

    if (configCount <= 1) {
      throw new BadRequestException("The last config of a project cannot be deleted");
    }

    const auditLogCount = await this.prisma.auditLog.count({ where: { configId } });
    if (auditLogCount > 0) {
      throw new BadRequestException("Config has audit history and cannot be hard deleted");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.configAudit.createConfigDeletedLog(tx, {
        actorUserId: userId,
        config,
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      await tx.config.delete({ where: { id: configId } });
    });

    return { ok: true };
  }
}

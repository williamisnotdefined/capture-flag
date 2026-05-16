import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigAccessService, ConfigAuditService } from "../support";

export type UpdateConfigInput = {
  configId: string;
  input: { description?: string; name?: string };
  userId: string;
};

@Injectable()
export class UpdateConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configAccess: ConfigAccessService,
    private readonly configAudit: ConfigAuditService,
  ) {}

  async execute({ userId, configId, input }: UpdateConfigInput) {
    const { access, config } = await this.configAccess.findConfigForUpdate(userId, configId);
    const update = this.normalizeInput(input, config);

    if (update.changedFields.length === 0) {
      return config;
    }

    return this.prisma.$transaction(
      async (tx) => {
        const currentConfig = await tx.config.findUnique({ where: { id: configId } });
        if (!currentConfig) {
          throw new NotFoundException("Config not found");
        }

        const updatedConfig = await tx.config.update({
          where: { id: configId },
          data: update.data,
        });

        await this.configAudit.createConfigUpdatedLog(tx, {
          actorUserId: userId,
          changedFields: update.changedFields,
          currentConfig,
          organizationId: access.project.organizationId,
          projectId: currentConfig.projectId,
          updatedConfig,
        });

        return updatedConfig;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private normalizeInput(
    input: UpdateConfigInput["input"],
    config: { description: string | null; name: string },
  ) {
    const data: Prisma.ConfigUncheckedUpdateInput = {};
    const changedFields: string[] = [];
    let receivedAnyField = false;

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException("Config name is required");
      }
      if (name !== config.name) {
        data.name = name;
        changedFields.push("name");
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== config.description) {
        data.description = description;
        changedFields.push("description");
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No config fields to update");
    }

    return { changedFields, data };
  }
}

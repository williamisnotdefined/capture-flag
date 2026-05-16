import { BadRequestException, Injectable } from "@nestjs/common";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigAccessService, ConfigAuditService, ConfigEnvironmentStateService } from "../support";

export type CreateConfigInput = {
  input: { key?: string; name?: string; description?: string };
  projectId: string;
  userId: string;
};

@Injectable()
export class CreateConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configAccess: ConfigAccessService,
    private readonly configAudit: ConfigAuditService,
    private readonly configEnvironmentState: ConfigEnvironmentStateService,
  ) {}

  async execute({ userId, projectId, input }: CreateConfigInput) {
    const access = await this.configAccess.requireProjectManager(userId, projectId);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Config name is required");
    }

    const key = requireSlug(input.key ?? name, "config");

    return this.prisma.$transaction(async (tx) => {
      const config = await tx.config.create({
        data: {
          projectId,
          key,
          name,
          description: input.description?.trim() || null,
        },
      });

      const environments = await this.configEnvironmentState.createStateRowsForConfig(
        tx,
        projectId,
        config.id,
      );

      await this.configAudit.createConfigCreatedLog(tx, {
        actorUserId: userId,
        config,
        environmentIds: environments.map((environment) => environment.id),
        organizationId: access.project.organizationId,
        projectId,
      });

      return config;
    });
  }
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { organizationManagerRoles } from "../../common/roles";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectAuditService } from "../support";

export type CreateProjectInput = {
  input: { name?: string; slug?: string };
  organizationId: string;
  userId: string;
};

@Injectable()
export class CreateProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly projectAudit: ProjectAuditService,
  ) {}

  async execute({ userId, organizationId, input }: CreateProjectInput) {
    await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Project name is required");
    }

    const slug = requireSlug(input.slug ?? name, "project");

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organizationId,
          name,
          slug,
        },
      });

      const config = await tx.config.create({
        data: {
          projectId: project.id,
          key: "default",
          name: "Default",
        },
      });

      const projectMember = await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId,
          },
        },
        create: {
          projectId: project.id,
          userId,
          role: "project_admin",
        },
        update: {
          role: "project_admin",
        },
      });

      await createAuditLog(tx, {
        action: "config.created",
        actorUserId: userId,
        configId: config.id,
        entityId: config.id,
        entityType: "config",
        metadata: toAuditJson({ bootstrap: true }),
        newValue: this.projectAudit.configAuditValue(config),
        organizationId,
        projectId: project.id,
      });

      await createAuditLog(tx, {
        action: "project_member.added",
        actorUserId: userId,
        entityId: projectMember.id,
        entityType: "project_member",
        metadata: toAuditJson({ bootstrap: true, targetUserId: userId }),
        newValue: this.projectAudit.projectMemberAuditValue(projectMember),
        organizationId,
        projectId: project.id,
      });

      return {
        ...project,
        configs: [config],
        environments: [],
      };
    });
  }
}

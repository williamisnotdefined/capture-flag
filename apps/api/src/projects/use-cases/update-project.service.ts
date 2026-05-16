import { BadRequestException, Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { toAuditJson } from "../../common/audit-log";
import { bumpConfigEnvironmentState } from "../../common/config-state";
import { projectManagerRoles } from "../../common/roles";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";

const projectWithCountsSelect = {
  id: true,
  organizationId: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      configs: true,
      environments: true,
      members: true,
    },
  },
} as const;

export type UpdateProjectInput = {
  input: { name?: string; slug?: string };
  projectId: string;
  userId: string;
};

@Injectable()
export class UpdateProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, projectId, input }: UpdateProjectInput) {
    const access = await this.access.requireProjectRole(userId, projectId, projectManagerRoles);

    const data: { name?: string; slug?: string } = {};
    let shouldBumpPublicConfig = false;
    if (input.name?.trim()) {
      data.name = input.name.trim();
    }

    if (input.slug?.trim()) {
      const slug = requireSlug(input.slug, "project");
      data.slug = slug;
      shouldBumpPublicConfig = slug !== access.project.slug;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No project fields to update");
    }

    if (!shouldBumpPublicConfig) {
      return this.prisma.project
        .update({
          where: { id: projectId },
          data,
          select: projectWithCountsSelect,
        })
        .then((project) => this.toProjectReadModel(project));
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data,
        select: projectWithCountsSelect,
      });
      const states = await tx.configEnvironmentState.findMany({
        where: { projectId },
        select: {
          configId: true,
          environmentId: true,
        },
      });

      for (const state of states) {
        await bumpConfigEnvironmentState(tx, state.configId, state.environmentId, {
          actorUserId: userId,
          metadata: toAuditJson({ projectId }),
          organizationId: access.project.organizationId,
          projectId,
          sourceAction: "project.updated",
          sourceEntityId: projectId,
          sourceEntityType: "project",
        });
      }

      return this.toProjectReadModel(updatedProject);
    });
  }

  private toProjectReadModel<
    TProject extends { _count: { configs: number; environments: number; members: number } },
  >(project: TProject) {
    const { _count, ...projectFields } = project;

    return {
      ...projectFields,
      configCount: _count?.configs ?? 0,
      environmentCount: _count?.environments ?? 0,
      memberCount: _count?.members ?? 0,
    };
  }
}

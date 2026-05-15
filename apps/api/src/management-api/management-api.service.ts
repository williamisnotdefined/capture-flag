import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ApiTokenRequestContext } from "../common/authenticated-request";
import type {
  CreateFeatureFlagDto,
  CreateManagementFeatureFlagDto,
  CreateProjectDto,
  UpdateFeatureFlagDto,
} from "../common/dtos";
import { EnvironmentsService } from "../environments/environments.service";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "../projects/projects.service";

@Injectable()
export class ManagementApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly featureFlags: FeatureFlagsService,
    private readonly environments: EnvironmentsService,
  ) {}

  async listProjects(userId: string, apiToken: ApiTokenRequestContext) {
    const projects = await this.projects.listForOrganization(userId, apiToken.organizationId);
    if (!apiToken.projectId) {
      return projects;
    }

    return projects.filter((project) => project.id === apiToken.projectId);
  }

  createProject(userId: string, apiToken: ApiTokenRequestContext, input: CreateProjectDto) {
    if (apiToken.projectId) {
      throw new ForbiddenException("Project-scoped API token cannot create projects");
    }

    return this.projects.create(userId, apiToken.organizationId, input);
  }

  listFlags(userId: string, configId: string) {
    return this.featureFlags.list(userId, configId);
  }

  createFlag(userId: string, input: CreateManagementFeatureFlagDto) {
    const { configId, ...flagInput } = input;
    return this.featureFlags.create(userId, configId, flagInput as CreateFeatureFlagDto);
  }

  async updateFlag(userId: string, featureFlagId: string, input: UpdateFeatureFlagDto) {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { id: featureFlagId },
      select: {
        configId: true,
        deletedAt: true,
      },
    });
    if (!featureFlag || featureFlag.deletedAt) {
      throw new NotFoundException("Feature flag not found");
    }

    return this.featureFlags.update(userId, featureFlag.configId, featureFlagId, input);
  }

  listEnvironments(userId: string, projectId: string) {
    return this.environments.list(userId, projectId);
  }
}

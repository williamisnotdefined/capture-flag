import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedRequest } from "../../common/authenticated-request";
import { PrismaService } from "../../prisma/prisma.service";

type ApiTokenContext = NonNullable<AuthenticatedRequest["apiToken"]>;

@Injectable()
export class ApiTokenTenantResourceService {
  constructor(private readonly prisma: PrismaService) {}

  assertOrganization(apiToken: ApiTokenContext, organizationId: string) {
    if (organizationId !== apiToken.organizationId) {
      throw new NotFoundException("Organization not found");
    }

    if (apiToken.projectId) {
      throw new ForbiddenException("Project-scoped API token cannot access organization resources");
    }
  }

  async assertProject(apiToken: ApiTokenContext, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    this.assertProjectRecord(apiToken, project, "Project");
  }

  async assertConfig(apiToken: ApiTokenContext, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!config) {
      throw new NotFoundException("Config not found");
    }

    this.assertProjectRecord(
      apiToken,
      {
        id: config.projectId,
        organizationId: config.project.organizationId,
      },
      "Config",
    );
  }

  async assertEnvironment(apiToken: ApiTokenContext, environmentId: string) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    this.assertProjectRecord(
      apiToken,
      {
        id: environment.projectId,
        organizationId: environment.project.organizationId,
      },
      "Environment",
    );
  }

  async assertFeatureFlag(apiToken: ApiTokenContext, featureFlagId: string) {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { id: featureFlagId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!featureFlag) {
      throw new NotFoundException("Feature flag not found");
    }

    this.assertProjectRecord(
      apiToken,
      {
        id: featureFlag.projectId,
        organizationId: featureFlag.project.organizationId,
      },
      "Feature flag",
    );
  }

  async assertSegment(apiToken: ApiTokenContext, segmentId: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!segment) {
      throw new NotFoundException("Segment not found");
    }

    this.assertProjectRecord(
      apiToken,
      {
        id: segment.projectId,
        organizationId: segment.project.organizationId,
      },
      "Segment",
    );
  }

  private assertProjectRecord(
    apiToken: ApiTokenContext,
    project: { id: string; organizationId: string },
    resourceName: string,
  ) {
    if (project.organizationId !== apiToken.organizationId) {
      throw new NotFoundException(`${resourceName} not found`);
    }

    if (apiToken.projectId && project.id !== apiToken.projectId) {
      throw new NotFoundException(`${resourceName} not found`);
    }
  }
}

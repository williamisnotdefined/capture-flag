import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { PrismaService } from "../prisma/prisma.service";
import {
  type ApiTokenTenantRequirement,
  apiTokenTenantMetadataKey,
} from "./api-token-tenant.decorator";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ApiTokenContext = NonNullable<AuthenticatedRequest["apiToken"]>;

@Injectable()
export class ApiTokenTenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiToken = request.apiToken;
    if (!apiToken) {
      return true;
    }

    const requirement = this.reflector.getAllAndOverride<ApiTokenTenantRequirement>(
      apiTokenTenantMetadataKey,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) {
      return true;
    }

    const organizationId = this.valueFrom(request.params, requirement.organizationParam);
    if (organizationId) {
      this.assertOrganization(apiToken, organizationId);
    }

    for (const projectId of [
      this.valueFrom(request.params, requirement.projectParam),
      this.valueFrom(request.query, requirement.projectQuery),
    ]) {
      if (projectId) {
        await this.assertProject(apiToken, projectId);
      }
    }

    for (const configId of [
      this.valueFrom(request.params, requirement.configParam),
      this.valueFrom(request.query, requirement.configQuery),
      this.valueFrom(request.body, requirement.configBody),
    ]) {
      if (configId) {
        await this.assertConfig(apiToken, configId);
      }
    }

    const environmentId = this.valueFrom(request.params, requirement.environmentParam);
    if (environmentId) {
      await this.assertEnvironment(apiToken, environmentId);
    }

    const featureFlagId = this.valueFrom(request.params, requirement.featureFlagParam);
    if (featureFlagId) {
      await this.assertFeatureFlag(apiToken, featureFlagId);
    }

    const segmentId = this.valueFrom(request.params, requirement.segmentParam);
    if (segmentId) {
      await this.assertSegment(apiToken, segmentId);
    }

    return true;
  }

  private valueFrom(source: unknown, key: string | undefined) {
    if (!key || !source || typeof source !== "object") {
      return null;
    }

    const value = (source as Record<string, unknown>)[key];
    return typeof value === "string" && uuidPattern.test(value) ? value : null;
  }

  private assertOrganization(apiToken: ApiTokenContext, organizationId: string) {
    if (organizationId !== apiToken.organizationId) {
      throw new ForbiddenException("API token cannot access this organization");
    }

    if (apiToken.projectId) {
      throw new ForbiddenException("Project-scoped API token cannot access organization resources");
    }
  }

  private async assertProject(apiToken: ApiTokenContext, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    this.assertProjectRecord(apiToken, project);
  }

  private async assertConfig(apiToken: ApiTokenContext, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!config) {
      throw new NotFoundException("Config not found");
    }

    this.assertProjectRecord(apiToken, {
      id: config.projectId,
      organizationId: config.project.organizationId,
    });
  }

  private async assertEnvironment(apiToken: ApiTokenContext, environmentId: string) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!environment) {
      throw new NotFoundException("Environment not found");
    }

    this.assertProjectRecord(apiToken, {
      id: environment.projectId,
      organizationId: environment.project.organizationId,
    });
  }

  private async assertFeatureFlag(apiToken: ApiTokenContext, featureFlagId: string) {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { id: featureFlagId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!featureFlag) {
      throw new NotFoundException("Feature flag not found");
    }

    this.assertProjectRecord(apiToken, {
      id: featureFlag.projectId,
      organizationId: featureFlag.project.organizationId,
    });
  }

  private async assertSegment(apiToken: ApiTokenContext, segmentId: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
      select: { projectId: true, project: { select: { organizationId: true } } },
    });
    if (!segment) {
      throw new NotFoundException("Segment not found");
    }

    this.assertProjectRecord(apiToken, {
      id: segment.projectId,
      organizationId: segment.project.organizationId,
    });
  }

  private assertProjectRecord(
    apiToken: ApiTokenContext,
    project: { id: string; organizationId: string },
  ) {
    if (project.organizationId !== apiToken.organizationId) {
      throw new ForbiddenException("API token cannot access this organization");
    }

    if (apiToken.projectId && project.id !== apiToken.projectId) {
      throw new ForbiddenException("API token cannot access this project");
    }
  }
}

import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  type ApiTokenTenantRequirement,
  apiTokenTenantMetadataKey,
} from "./api-token-tenant.decorator";
import { ApiTokenTenantResourceService } from "./support";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ApiTokenTenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantResources: ApiTokenTenantResourceService,
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
      this.tenantResources.assertOrganization(apiToken, organizationId);
    }

    for (const projectId of [
      this.valueFrom(request.params, requirement.projectParam),
      this.valueFrom(request.query, requirement.projectQuery),
    ]) {
      if (projectId) {
        await this.tenantResources.assertProject(apiToken, projectId);
      }
    }

    for (const configId of [
      this.valueFrom(request.params, requirement.configParam),
      this.valueFrom(request.query, requirement.configQuery),
      this.valueFrom(request.body, requirement.configBody),
    ]) {
      if (configId) {
        await this.tenantResources.assertConfig(apiToken, configId);
      }
    }

    const environmentId = this.valueFrom(request.params, requirement.environmentParam);
    if (environmentId) {
      await this.tenantResources.assertEnvironment(apiToken, environmentId);
    }

    const featureFlagId = this.valueFrom(request.params, requirement.featureFlagParam);
    if (featureFlagId) {
      await this.tenantResources.assertFeatureFlag(apiToken, featureFlagId);
    }

    const segmentId = this.valueFrom(request.params, requirement.segmentParam);
    if (segmentId) {
      await this.tenantResources.assertSegment(apiToken, segmentId);
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
}

import { SetMetadata } from "@nestjs/common";

export type ApiTokenTenantRequirement = {
  configBody?: string;
  configParam?: string;
  configQuery?: string;
  environmentParam?: string;
  featureFlagParam?: string;
  organizationParam?: string;
  projectParam?: string;
  projectQuery?: string;
  segmentParam?: string;
};

export const apiTokenTenantMetadataKey = "capture-flag:api-token-tenant";

export function RequireApiTokenTenant(requirement: ApiTokenTenantRequirement) {
  return SetMetadata(apiTokenTenantMetadataKey, requirement);
}

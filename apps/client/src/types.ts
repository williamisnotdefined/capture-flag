export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  configs?: Config[];
  environments?: Environment[];
  currentUserProjectRole?: string | null;
};

export type Config = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
};

export type Environment = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  sortOrder: number;
};

export type FeatureFlagType = "boolean" | "string" | "integer" | "double";

export type FeatureFlagEnvironmentValue = {
  id: string;
  projectId: string;
  configId: string;
  featureFlagId: string;
  environmentId: string;
  defaultValue: unknown;
  rulesJson: unknown[];
  percentageAttribute: string;
  percentageOptionsJson: unknown[];
  updatedByUserId: string | null;
  environment: Pick<Environment, "id" | "key" | "name" | "sortOrder">;
};

export type FeatureFlag = {
  id: string;
  projectId: string;
  configId: string;
  key: string;
  name: string;
  description: string | null;
  type: FeatureFlagType;
  tags: string[];
  hint: string | null;
  ownerUserId: string | null;
  deletedAt: string | null;
  owner: UserSummary | null;
  environmentValues: FeatureFlagEnvironmentValue[];
};

export type Segment = {
  id: string;
  projectId: string;
  configId: string;
  key: string;
  name: string;
  description: string | null;
  conditionsJson: unknown[];
  deletedAt: string | null;
};

export type SdkKey = {
  id: string;
  projectId: string;
  configId: string;
  environmentId: string;
  name: string;
  keyPrefix: string;
  key?: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  config: Pick<Config, "id" | "key" | "name">;
  environment: Pick<Environment, "id" | "key" | "name">;
};

export type ConfigPreview = {
  body: unknown;
  etag: string;
};

export type AuditLog = {
  id: string;
  organizationId: string;
  projectId: string | null;
  configId: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: unknown | null;
  newValue: unknown | null;
  metadata: unknown;
  createdAt: string;
  actor: UserSummary | null;
};

export type AuditLogFilters = {
  action?: string;
  actorUserId?: string;
  configId?: string;
  cursor?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  limit?: number;
  projectId?: string;
  to?: string;
};

export type AuditLogListResponse = {
  items: AuditLog[];
  nextCursor: string | null;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  user: UserSummary;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: UserSummary;
};

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  };
  organizations: Organization[];
};

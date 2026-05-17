import type {
  AuditLog,
  Config,
  ConfigPreview,
  Environment,
  FeatureFlag,
  FeatureFlagEnvironmentValue,
  MeResponse,
  Organization,
  OrganizationMember,
  Project,
  ProjectMember,
  SdkKey,
  Segment,
  UserSummary,
} from "@src/types";

export const storyUser: UserSummary = {
  email: "ana@example.com",
  id: "user_ana",
  name: "Ana Silva",
};

export const storySecondUser: UserSummary = {
  email: "bruno@example.com",
  id: "user_bruno",
  name: "Bruno Costa",
};

export const storyThirdUser: UserSummary = {
  email: "carla@example.com",
  id: "user_carla",
  name: "Carla Ramos",
};

export const storyOrganizations: Organization[] = [
  {
    id: "org_acme",
    memberCount: 3,
    name: "Acme Product",
    projectCount: 2,
    role: "owner",
    slug: "acme-product",
  },
  {
    id: "org_nova",
    memberCount: 8,
    name: "Nova Labs",
    projectCount: 4,
    role: "admin",
    slug: "nova-labs",
  },
];

export const storyConfigs: Config[] = [
  {
    description: "Runtime config consumida pelo SDK web.",
    id: "cfg_default",
    key: "default",
    name: "Default",
    projectId: "project_console",
  },
  {
    description: "Experimentos de checkout.",
    id: "cfg_checkout",
    key: "checkout",
    name: "Checkout",
    projectId: "project_console",
  },
];

export const storyEnvironments: Environment[] = [
  {
    id: "env_prod",
    key: "production",
    name: "Production",
    projectId: "project_console",
    sortOrder: 1,
  },
  {
    id: "env_stage",
    key: "staging",
    name: "Staging",
    projectId: "project_console",
    sortOrder: 2,
  },
];

export const storyProjects: Project[] = [
  {
    configCount: storyConfigs.length,
    configs: storyConfigs,
    currentUserProjectRole: "project_admin",
    environmentCount: storyEnvironments.length,
    environments: storyEnvironments,
    id: "project_console",
    memberCount: 3,
    name: "Console Web",
    organizationId: "org_acme",
    slug: "console-web",
  },
  {
    configCount: 1,
    currentUserProjectRole: "developer",
    environmentCount: 2,
    id: "project_mobile",
    memberCount: 5,
    name: "Mobile SDK",
    organizationId: "org_acme",
    slug: "mobile-sdk",
  },
];

export const storyOrganizationMembers: OrganizationMember[] = [
  {
    id: "org_member_ana",
    organizationId: "org_acme",
    role: "owner",
    user: storyUser,
    userId: storyUser.id,
  },
  {
    id: "org_member_bruno",
    organizationId: "org_acme",
    role: "admin",
    user: storySecondUser,
    userId: storySecondUser.id,
  },
  {
    id: "org_member_carla",
    organizationId: "org_acme",
    role: "member",
    user: storyThirdUser,
    userId: storyThirdUser.id,
  },
];

export const storyProjectMembers: ProjectMember[] = [
  {
    id: "project_member_ana",
    projectId: "project_console",
    role: "project_admin",
    user: storyUser,
    userId: storyUser.id,
  },
  {
    id: "project_member_bruno",
    projectId: "project_console",
    role: "developer",
    user: storySecondUser,
    userId: storySecondUser.id,
  },
];

export const storyMemberTargetOptions = storyOrganizationMembers.map((member) => ({
  description: member.user.email ?? undefined,
  label: member.user.name,
  value: member.user.id,
}));

export const storySegments: Segment[] = [
  {
    conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
    configId: "cfg_default",
    deletedAt: null,
    description: "Usuarios internos e beta testers.",
    id: "segment_beta",
    key: "beta-users",
    name: "Beta users",
    projectId: "project_console",
  },
  {
    conditionsJson: [{ attribute: "country", operator: "oneOf", value: ["BR", "PT"] }],
    configId: "cfg_default",
    deletedAt: null,
    description: "Usuarios de mercados lusofonos.",
    id: "segment_lusophone",
    key: "lusophone-markets",
    name: "Lusophone markets",
    projectId: "project_console",
  },
];

export const storyBooleanFlagValue: FeatureFlagEnvironmentValue = {
  configId: "cfg_default",
  defaultValue: true,
  environment: storyEnvironments[0],
  environmentId: "env_prod",
  featureFlagId: "flag_checkout",
  id: "flag_value_checkout_prod",
  percentageAttribute: "identifier",
  percentageOptionsJson: [
    { percentage: 25, value: true },
    { percentage: 75, value: false },
  ],
  projectId: "project_console",
  rulesJson: [
    {
      conditions: [{ segment: "beta-users" }],
      value: true,
    },
  ],
  updatedByUserId: storyUser.id,
};

export const storyStringFlagValue: FeatureFlagEnvironmentValue = {
  configId: "cfg_default",
  defaultValue: "compact",
  environment: storyEnvironments[0],
  environmentId: "env_prod",
  featureFlagId: "flag_theme",
  id: "flag_value_theme_prod",
  percentageAttribute: "identifier",
  percentageOptionsJson: [],
  projectId: "project_console",
  rulesJson: [],
  updatedByUserId: storySecondUser.id,
};

export const storyFeatureFlags: FeatureFlag[] = [
  {
    configId: "cfg_default",
    deletedAt: null,
    description: "Libera o novo checkout por segmento e rollout.",
    environmentValues: [storyBooleanFlagValue],
    hint: "Fallback seguro e false ate concluir monitoramento.",
    id: "flag_checkout",
    initialDefaultValue: false,
    key: "newCheckout",
    name: "Novo checkout",
    owner: storyUser,
    ownerUserId: storyUser.id,
    projectId: "project_console",
    tags: ["checkout", "beta"],
    type: "boolean",
  },
  {
    configId: "cfg_default",
    deletedAt: null,
    description: "Controla o tema padrao do console.",
    environmentValues: [storyStringFlagValue],
    hint: null,
    id: "flag_theme",
    initialDefaultValue: "classic",
    key: "consoleTheme",
    name: "Tema do console",
    owner: storySecondUser,
    ownerUserId: storySecondUser.id,
    projectId: "project_console",
    tags: ["ui"],
    type: "string",
  },
  {
    configId: "cfg_default",
    deletedAt: null,
    description: "Limites por organizacao para testes de carga.",
    environmentValues: [],
    hint: null,
    id: "flag_limits",
    initialDefaultValue: { maxProjects: 5, maxEnvironments: 3 },
    key: "tenantLimits",
    name: "Tenant limits",
    owner: null,
    ownerUserId: null,
    projectId: "project_console",
    tags: ["limits"],
    type: "json_object",
  },
];

export const storySdkKeys: SdkKey[] = [
  {
    config: storyConfigs[0],
    configId: "cfg_default",
    createdAt: "2026-05-10T14:30:00.000Z",
    environment: storyEnvironments[0],
    environmentId: "env_prod",
    id: "sdk_prod",
    keyPrefix: "cf_prod_abc123",
    lastUsedAt: "2026-05-16T12:40:00.000Z",
    name: "Production web",
    projectId: "project_console",
    revokedAt: null,
    updatedAt: "2026-05-10T14:30:00.000Z",
  },
  {
    config: storyConfigs[0],
    configId: "cfg_default",
    createdAt: "2026-04-22T09:15:00.000Z",
    environment: storyEnvironments[1],
    environmentId: "env_stage",
    id: "sdk_stage",
    keyPrefix: "cf_stage_xyz789",
    lastUsedAt: null,
    name: "Staging",
    projectId: "project_console",
    revokedAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
  },
];

export const storyAuditLogs: AuditLog[] = [
  {
    action: "feature_flag.update_value",
    actor: storyUser,
    actorUserId: storyUser.id,
    configId: "cfg_default",
    createdAt: "2026-05-16T12:45:00.000Z",
    entityId: "flag_checkout",
    entityType: "FeatureFlag",
    id: "audit_value",
    metadata: { environmentId: "env_prod" },
    newValue: { defaultValue: true },
    oldValue: { defaultValue: false },
    organizationId: "org_acme",
    projectId: "project_console",
  },
  {
    action: "sdk_key.rotate",
    actor: storySecondUser,
    actorUserId: storySecondUser.id,
    configId: "cfg_default",
    createdAt: "2026-05-15T16:10:00.000Z",
    entityId: "sdk_prod",
    entityType: "SdkKey",
    id: "audit_sdk",
    metadata: { keyPrefix: "cf_prod_abc123" },
    newValue: null,
    oldValue: null,
    organizationId: "org_acme",
    projectId: "project_console",
  },
];

export const storyConfigPreview: ConfigPreview = {
  body: {
    config: {
      environment: "production",
      key: "default",
      revision: 42,
    },
    flags: {
      consoleTheme: "compact",
      newCheckout: true,
      tenantLimits: { maxEnvironments: 3, maxProjects: 5 },
    },
  },
  etag: '"cfg-default-prod-42"',
};

export const storyMe: MeResponse = {
  organizations: storyOrganizations,
  user: storyUser,
};

export const defaultProjectRoute =
  "/organizations/org_acme/projects/project_console/configs/cfg_default?environmentId=env_prod";
export const flagsRoute = `${defaultProjectRoute.split("?")[0]}/flags?environmentId=env_prod`;
export const segmentsRoute = `${defaultProjectRoute.split("?")[0]}/segments?environmentId=env_prod`;
export const sdkKeysRoute =
  "/organizations/org_acme/projects/project_console/sdk-keys?configId=cfg_default&environmentId=env_prod";
export const auditLogsRoute = "/organizations/org_acme/audit-logs?projectId=project_console";

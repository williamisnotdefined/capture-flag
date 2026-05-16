import type { APIRequestContext } from "@playwright/test";
import {
  type ApiToken,
  type ApiTokenScope,
  createApiTokenViaApi,
  createExpiredApiTokenViaDb,
  revokeApiTokenViaApi,
} from "./api-tokens";
import { createAuthenticatedUser } from "./auth";
import {
  type FeatureFlag,
  type FeatureFlagType,
  createFeatureFlagViaApi,
  deleteFeatureFlagViaApi,
  updateFeatureFlagValueViaApi,
} from "./feature-flags";
import {
  type OrganizationRole,
  type ProjectRole,
  addOrganizationMemberViaApi,
  addProjectMemberViaApi,
} from "./members";
import { type SdkKey, createSdkKeyViaApi, revokeSdkKeyViaApi } from "./sdk-keys";
import { type Segment, createSegmentViaApi } from "./segments";
import {
  type Config,
  type Environment,
  type Organization,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
  createProjectViaApi,
} from "./workspace";

export type SmallWorkspaceFixture = {
  config: Config;
  environments: {
    production: Environment;
    staging: Environment;
  };
  organization: Organization;
  project: Project;
  sessionToken: string;
  user: { id: string };
};

export type FlagWorkspaceFixture = SmallWorkspaceFixture & {
  archivedFlag: FeatureFlag;
  primaryFlags: FeatureFlag[];
  secondaryConfig: Config;
  secondaryFlags: FeatureFlag[];
};

export type TargetingWorkspaceFixture = FlagWorkspaceFixture & {
  rolloutFlag: FeatureFlag;
  segment: Segment;
  targetFlag: FeatureFlag;
};

export type RbacWorkspaceFixture = FlagWorkspaceFixture & {
  members: {
    developer: FixtureUser;
    organizationViewer: FixtureUser;
    projectAdmin: FixtureUser;
    viewer: FixtureUser;
  };
};

export type TokenWorkspaceFixture = FlagWorkspaceFixture & {
  apiTokens: {
    expired: { rawToken: string };
    organization: ApiTokenWithRaw;
    project: ApiTokenWithRaw;
    revoked: ApiTokenWithRaw;
  };
  otherProject: Project;
  sdkKeys: {
    active: SdkKeyWithRaw;
    revoked: SdkKeyWithRaw;
  };
};

type ApiTokenWithRaw = ApiToken & { rawToken: string };
type SdkKeyWithRaw = SdkKey & { rawKey: string };
type FixtureUser = {
  sessionToken: string;
  user: { id: string };
};

const managementScopes: ApiTokenScope[] = [
  "projects:read",
  "projects:write",
  "flags:read",
  "flags:write",
  "environments:read",
];

const typedFlagInputs: Array<{
  defaultValue: unknown;
  key: string;
  name: string;
  tags: string[];
  type: FeatureFlagType;
}> = [
  {
    defaultValue: false,
    key: "booleanFlag",
    name: "Boolean Flag",
    tags: ["typed", "boolean"],
    type: "boolean",
  },
  {
    defaultValue: "control",
    key: "stringConfig",
    name: "String Config",
    tags: ["typed", "remote-config"],
    type: "string",
  },
  {
    defaultValue: 1,
    key: "integerConfig",
    name: "Integer Config",
    tags: ["typed", "remote-config"],
    type: "integer",
  },
  {
    defaultValue: 1.5,
    key: "doubleConfig",
    name: "Double Config",
    tags: ["typed", "remote-config"],
    type: "double",
  },
  {
    defaultValue: { theme: "blue" },
    key: "jsonObjectConfig",
    name: "JSON Object Config",
    tags: ["typed", "json"],
    type: "json_object",
  },
  {
    defaultValue: ["alpha", "beta"],
    key: "jsonArrayConfig",
    name: "JSON Array Config",
    tags: ["typed", "json"],
    type: "json_array",
  },
];

export async function createSmallWorkspace(
  request: APIRequestContext,
  input: { projectSlug?: string; userEmail?: string } = {},
): Promise<SmallWorkspaceFixture> {
  const projectSlug = input.projectSlug ?? "populated-small-project";
  const { defaultConfig, organization, project, sessionToken, user } = await createCoreWorkspace(
    request,
    {
      organizationName: `${projectSlug} org`,
      organizationSlug: `${projectSlug}-org`,
      projectName: `${projectSlug} project`,
      projectSlug,
      userEmail: input.userEmail ?? `${projectSlug}@capture-flag.test`,
      userName: `${projectSlug} owner`,
    },
  );
  const production = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });
  const staging = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "staging",
    name: "Staging",
  });

  return {
    config: defaultConfig,
    environments: { production, staging },
    organization,
    project,
    sessionToken,
    user,
  };
}

export async function createFlagWorkspace(
  request: APIRequestContext,
  input: { projectSlug?: string; userEmail?: string } = {},
): Promise<FlagWorkspaceFixture> {
  const workspace = await createSmallWorkspace(request, {
    projectSlug: input.projectSlug ?? "populated-flags-project",
    userEmail: input.userEmail ?? "populated-flags@capture-flag.test",
  });
  const secondaryConfig = await createConfigViaApi(
    request,
    workspace.sessionToken,
    workspace.project.id,
    {
      key: "secondary-config",
      name: "Secondary Config",
    },
  );

  const primaryFlags: FeatureFlag[] = [];
  for (const flagInput of typedFlagInputs) {
    primaryFlags.push(
      await createFeatureFlagViaApi(
        request,
        workspace.sessionToken,
        workspace.config.id,
        flagInput,
      ),
    );
  }

  for (let index = 0; index < 18; index += 1) {
    primaryFlags.push(
      await createFeatureFlagViaApi(request, workspace.sessionToken, workspace.config.id, {
        defaultValue: false,
        key: `bulkFlag${String(index).padStart(2, "0")}`,
        name: `Bulk Flag ${String(index).padStart(2, "0")}`,
        tags: ["bulk", index % 2 === 0 ? "even" : "odd"],
        type: "boolean",
      }),
    );
  }

  const archivedFlag = await createFeatureFlagViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    {
      defaultValue: false,
      key: "archivedFlag",
      name: "Archived Flag",
      tags: ["archived"],
      type: "boolean",
    },
  );
  await deleteFeatureFlagViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    archivedFlag.id,
  );

  const secondaryFlags: FeatureFlag[] = [];
  for (let index = 0; index < 3; index += 1) {
    secondaryFlags.push(
      await createFeatureFlagViaApi(request, workspace.sessionToken, secondaryConfig.id, {
        defaultValue: `secondary-${index}`,
        key: `secondaryFlag${index}`,
        name: `Secondary Flag ${index}`,
        tags: ["secondary"],
        type: "string",
      }),
    );
  }

  return {
    ...workspace,
    archivedFlag,
    primaryFlags,
    secondaryConfig,
    secondaryFlags,
  };
}

export async function createTargetingWorkspace(
  request: APIRequestContext,
): Promise<TargetingWorkspaceFixture> {
  const workspace = await createFlagWorkspace(request, {
    projectSlug: "populated-targeting-project",
    userEmail: "populated-targeting@capture-flag.test",
  });
  const segment = await createSegmentViaApi(request, workspace.sessionToken, workspace.config.id, {
    conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@beta.test" }],
    key: "beta-users",
    name: "Beta Users",
  });
  const prerequisiteFlag = await createFeatureFlagViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    {
      defaultValue: false,
      key: "accountEnabled",
      name: "Account Enabled",
      tags: ["targeting"],
      type: "boolean",
    },
  );
  await updateFeatureFlagValueViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    prerequisiteFlag.id,
    workspace.environments.production.id,
    { defaultValue: true },
  );

  const targetFlag = await createFeatureFlagViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    {
      defaultValue: false,
      key: "targetingDecision",
      name: "Targeting Decision",
      tags: ["targeting"],
      type: "boolean",
    },
  );
  await updateFeatureFlagValueViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    targetFlag.id,
    workspace.environments.production.id,
    {
      rulesJson: [
        { conditions: [{ segment: "beta-users" }], serve: true },
        {
          conditions: [
            { prerequisiteFlag: "accountEnabled", operator: "equals", value: true },
            { attribute: "plan", operator: "oneOf", value: ["pro", "enterprise"] },
          ],
          serve: true,
        },
      ],
    },
  );

  const rolloutFlag = await createFeatureFlagViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    {
      defaultValue: false,
      key: "rolloutDecision",
      name: "Rollout Decision",
      tags: ["targeting", "rollout"],
      type: "boolean",
    },
  );
  await updateFeatureFlagValueViaApi(
    request,
    workspace.sessionToken,
    workspace.config.id,
    rolloutFlag.id,
    workspace.environments.production.id,
    {
      percentageOptionsJson: [{ percentage: 100, value: true }],
    },
  );

  return {
    ...workspace,
    rolloutFlag,
    segment,
    targetFlag,
  };
}

export async function createRbacWorkspace(
  request: APIRequestContext,
): Promise<RbacWorkspaceFixture> {
  const workspace = await createFlagWorkspace(request, {
    projectSlug: "populated-rbac-project",
    userEmail: "populated-rbac-owner@capture-flag.test",
  });
  const [viewer, developer, projectAdmin, organizationViewer] = await Promise.all([
    createFixtureUser("populated-viewer"),
    createFixtureUser("populated-developer"),
    createFixtureUser("populated-project-admin"),
    createFixtureUser("populated-org-viewer"),
  ]);

  await grantProjectMember(request, workspace, viewer, "member", "viewer");
  await grantProjectMember(request, workspace, developer, "member", "developer");
  await grantProjectMember(request, workspace, projectAdmin, "member", "project_admin");
  await addOrganizationMemberViaApi(request, workspace.sessionToken, workspace.organization.id, {
    role: "viewer",
    userId: organizationViewer.user.id,
  });

  return {
    ...workspace,
    members: { developer, organizationViewer, projectAdmin, viewer },
  };
}

export async function createTokenWorkspace(
  request: APIRequestContext,
): Promise<TokenWorkspaceFixture> {
  const workspace = await createFlagWorkspace(request, {
    projectSlug: "populated-token-project",
    userEmail: "populated-token-owner@capture-flag.test",
  });
  const otherProject = await createProjectViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    {
      name: "Other Token Project",
      slug: "other-token-project",
    },
  );
  const activeSdkKey = await createSdkKeyViaApi(
    request,
    workspace.sessionToken,
    workspace.project.id,
    {
      configId: workspace.config.id,
      environmentId: workspace.environments.production.id,
      name: "Populated Active SDK Key",
    },
  );
  const revokedSdkKey = await createSdkKeyViaApi(
    request,
    workspace.sessionToken,
    workspace.project.id,
    {
      configId: workspace.config.id,
      environmentId: workspace.environments.staging.id,
      name: "Populated Revoked SDK Key",
    },
  );
  await revokeSdkKeyViaApi(request, workspace.sessionToken, revokedSdkKey.id);

  const organizationToken = await createApiTokenWithRaw(request, workspace, {
    name: "Populated Organization Token",
    scopes: managementScopes,
  });
  const projectToken = await createApiTokenWithRaw(request, workspace, {
    name: "Populated Project Token",
    projectId: workspace.project.id,
    scopes: managementScopes,
  });
  const revokedToken = await createApiTokenWithRaw(request, workspace, {
    name: "Populated Revoked Token",
    scopes: ["projects:read"],
  });
  await revokeApiTokenViaApi(request, workspace.sessionToken, revokedToken.id);
  const expiredToken = await createExpiredApiTokenViaDb({
    organizationId: workspace.organization.id,
    scopes: ["projects:read"],
    userId: workspace.user.id,
  });

  return {
    ...workspace,
    apiTokens: {
      expired: { rawToken: expiredToken.rawToken },
      organization: organizationToken,
      project: projectToken,
      revoked: revokedToken,
    },
    otherProject,
    sdkKeys: {
      active: { ...activeSdkKey, rawKey: activeSdkKey.key ?? "" },
      revoked: { ...revokedSdkKey, rawKey: revokedSdkKey.key ?? "" },
    },
  };
}

async function createFixtureUser(slug: string): Promise<FixtureUser> {
  const auth = await createAuthenticatedUser({
    email: `${slug}@capture-flag.test`,
    name: `${slug} user`,
  });

  return { sessionToken: auth.sessionToken, user: { id: auth.user.id } };
}

async function grantProjectMember(
  request: APIRequestContext,
  workspace: FlagWorkspaceFixture,
  targetUser: FixtureUser,
  organizationRole: OrganizationRole,
  projectRole: ProjectRole,
) {
  await addOrganizationMemberViaApi(request, workspace.sessionToken, workspace.organization.id, {
    role: organizationRole,
    userId: targetUser.user.id,
  });
  await addProjectMemberViaApi(request, workspace.sessionToken, workspace.project.id, {
    role: projectRole,
    userId: targetUser.user.id,
  });
}

async function createApiTokenWithRaw(
  request: APIRequestContext,
  workspace: FlagWorkspaceFixture,
  input: { name: string; projectId?: string; scopes: ApiTokenScope[] },
): Promise<ApiTokenWithRaw> {
  const apiToken = await createApiTokenViaApi(
    request,
    workspace.sessionToken,
    workspace.organization.id,
    input,
  );

  return { ...apiToken, rawToken: apiToken.token ?? "" };
}

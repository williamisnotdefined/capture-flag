import { type APIRequestContext, type APIResponse, expect, test } from "@playwright/test";
import { apiGetJson, apiUrl, authHeaders, expectJson } from "../support/api";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase } from "../support/db";
import {
  createFeatureFlagViaApi,
  deleteFeatureFlagViaApi,
  listFeatureFlagsViaApi,
  updateFeatureFlagValueViaApi,
  updateFeatureFlagViaApi,
} from "../support/feature-flags";
import { addOrganizationMemberViaApi, addProjectMemberViaApi } from "../support/members";
import { resetDatabase } from "../support/reset";
import { createSdkKeyViaApi } from "../support/sdk-keys";
import { createSegmentViaApi, listSegmentsViaApi } from "../support/segments";
import {
  type Config,
  type Environment,
  type Organization,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
} from "../support/workspace";

type TenantWorkspace = {
  config: Config;
  environment: Environment;
  organization: Organization;
  project: Project;
  sessionToken: string;
};

type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("blocks cross-organization reads and administration", async ({ request }) => {
  const tenantA = await createTenantWorkspace(request, {
    configKey: "tenant-a-config",
    projectSlug: "tenant-a-project",
    userEmail: "tenant-a-owner@capture-flag.test",
  });
  const tenantB = await createTenantWorkspace(request, {
    configKey: "tenant-b-config",
    projectSlug: "tenant-b-project",
    userEmail: "tenant-b-owner@capture-flag.test",
  });

  await expectForbidden(
    request.get(apiUrl(`/api/v1/organizations/${tenantA.organization.id}`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(apiUrl(`/api/v1/organizations/${tenantA.organization.id}/members`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(apiUrl(`/api/v1/organizations/${tenantA.organization.id}/audit-logs`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
});

test("blocks cross-project tenant access by global IDs", async ({ request }) => {
  const tenantA = await createTenantWorkspace(request, {
    configKey: "project-a-config",
    projectSlug: "project-a",
    userEmail: "project-a-owner@capture-flag.test",
  });
  const tenantB = await createTenantWorkspace(request, {
    configKey: "project-b-config",
    projectSlug: "project-b",
    userEmail: "project-b-owner@capture-flag.test",
  });

  await expectForbidden(
    request.get(apiUrl(`/api/v1/projects/${tenantA.project.id}`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.patch(apiUrl(`/api/v1/projects/${tenantA.project.id}`), {
      data: { name: "Cross Tenant Rename" },
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(apiUrl(`/api/v1/projects/${tenantA.project.id}/environments`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(apiUrl(`/api/v1/projects/${tenantA.project.id}/configs`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(apiUrl(`/api/v1/projects/${tenantA.project.id}/sdk-keys`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
});

test("blocks cross-config flag, segment, and preview access", async ({ request }) => {
  const tenantA = await createTenantWorkspace(request, {
    configKey: "config-a",
    projectSlug: "config-a-project",
    userEmail: "config-a-owner@capture-flag.test",
  });
  const tenantB = await createTenantWorkspace(request, {
    configKey: "config-b",
    projectSlug: "config-b-project",
    userEmail: "config-b-owner@capture-flag.test",
  });

  await expectForbidden(
    request.get(apiUrl(`/api/v1/configs/${tenantA.config.id}/feature-flags`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.post(apiUrl(`/api/v1/configs/${tenantA.config.id}/feature-flags`), {
      data: {
        defaultValue: false,
        key: "cross-tenant-flag",
        name: "Cross Tenant Flag",
        type: "boolean",
      },
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(apiUrl(`/api/v1/configs/${tenantA.config.id}/segments`), {
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.post(apiUrl(`/api/v1/configs/${tenantA.config.id}/segments`), {
      data: {
        conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
        key: "cross-tenant-segment",
        name: "Cross Tenant Segment",
      },
      headers: authHeaders(tenantB.sessionToken),
    }),
    "Organization access denied",
  );
  await expectForbidden(
    request.get(
      apiUrl(
        `/api/v1/configs/${tenantA.config.id}/environments/${tenantA.environment.id}/config-preview`,
      ),
      { headers: authHeaders(tenantB.sessionToken) },
    ),
    "Organization access denied",
  );
});

test("requires project membership for organization members before project access", async ({
  request,
}) => {
  const tenant = await createTenantWorkspace(request, {
    configKey: "org-member-project-access",
    projectSlug: "org-member-project-access-project",
    userEmail: "org-member-project-access-owner@capture-flag.test",
  });
  const memberAuth = await createAuthenticatedUser({
    email: "org-member-no-project@capture-flag.test",
    name: "Org Member No Project",
  });
  await addOrganizationMemberViaApi(request, tenant.sessionToken, tenant.organization.id, {
    role: "member",
    userId: memberAuth.user.id,
  });

  await expectForbidden(
    request.get(apiUrl(`/api/v1/projects/${tenant.project.id}`), {
      headers: authHeaders(memberAuth.sessionToken),
    }),
    "Project access denied",
  );

  await addProjectMemberViaApi(request, tenant.sessionToken, tenant.project.id, {
    role: "viewer",
    userId: memberAuth.user.id,
  });
  const project = await apiGetJson<Project>(
    request,
    `/api/v1/projects/${tenant.project.id}`,
    memberAuth.sessionToken,
  );
  expect(project).toMatchObject({ id: tenant.project.id, slug: tenant.project.slug });
});

test("allows project viewers to read but not mutate project resources", async ({ request }) => {
  const tenant = await createTenantWorkspace(request, {
    configKey: "viewer-access",
    projectSlug: "viewer-access-project",
    userEmail: "viewer-access-owner@capture-flag.test",
  });
  const flag = await createFeatureFlagViaApi(request, tenant.sessionToken, tenant.config.id, {
    defaultValue: false,
    key: "viewer-readable-flag",
    name: "Viewer Readable Flag",
    type: "boolean",
  });
  const segment = await createSegmentViaApi(request, tenant.sessionToken, tenant.config.id, {
    conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
    key: "viewer-readable-segment",
    name: "Viewer Readable Segment",
  });
  const viewerAuth = await createAuthenticatedUser({
    email: "project-viewer@capture-flag.test",
    name: "Project Viewer",
  });
  await addOrganizationMemberViaApi(request, tenant.sessionToken, tenant.organization.id, {
    role: "member",
    userId: viewerAuth.user.id,
  });
  await addProjectMemberViaApi(request, tenant.sessionToken, tenant.project.id, {
    role: "viewer",
    userId: viewerAuth.user.id,
  });

  await expect(
    apiGetJson<Project>(request, `/api/v1/projects/${tenant.project.id}`, viewerAuth.sessionToken),
  ).resolves.toMatchObject({ id: tenant.project.id });
  await expect(
    apiGetJson<Environment[]>(
      request,
      `/api/v1/projects/${tenant.project.id}/environments`,
      viewerAuth.sessionToken,
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: tenant.environment.id })]),
  );
  await expect(
    apiGetJson<Config[]>(
      request,
      `/api/v1/projects/${tenant.project.id}/configs`,
      viewerAuth.sessionToken,
    ),
  ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: tenant.config.id })]));
  await expect(
    listFeatureFlagsViaApi(request, viewerAuth.sessionToken, tenant.config.id),
  ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: flag.id })]));
  await expect(
    listSegmentsViaApi(request, viewerAuth.sessionToken, tenant.config.id),
  ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: segment.id })]));

  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/configs`), {
      data: { key: "viewer-config", name: "Viewer Config" },
      headers: authHeaders(viewerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/environments`), {
      data: { key: "viewer-env", name: "Viewer Env" },
      headers: authHeaders(viewerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/configs/${tenant.config.id}/feature-flags`), {
      data: { defaultValue: false, key: "viewer-flag", name: "Viewer Flag", type: "boolean" },
      headers: authHeaders(viewerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/configs/${tenant.config.id}/segments`), {
      data: {
        conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
        key: "viewer-segment",
        name: "Viewer Segment",
      },
      headers: authHeaders(viewerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/sdk-keys`), {
      data: { configId: tenant.config.id, environmentId: tenant.environment.id },
      headers: authHeaders(viewerAuth.sessionToken),
    }),
  );
});

test("allows developers to manage flags but not administrative project resources", async ({
  request,
}) => {
  const tenant = await createTenantWorkspace(request, {
    configKey: "developer-access",
    projectSlug: "developer-access-project",
    userEmail: "developer-access-owner@capture-flag.test",
  });
  const developerAuth = await createAuthenticatedUser({
    email: "project-developer@capture-flag.test",
    name: "Project Developer",
  });
  await addOrganizationMemberViaApi(request, tenant.sessionToken, tenant.organization.id, {
    role: "member",
    userId: developerAuth.user.id,
  });
  await addProjectMemberViaApi(request, tenant.sessionToken, tenant.project.id, {
    role: "developer",
    userId: developerAuth.user.id,
  });

  const developerFlag = await createFeatureFlagViaApi(
    request,
    developerAuth.sessionToken,
    tenant.config.id,
    {
      defaultValue: false,
      key: "developer-flag",
      name: "Developer Flag",
      type: "boolean",
    },
  );
  await expect(
    updateFeatureFlagViaApi(
      request,
      developerAuth.sessionToken,
      tenant.config.id,
      developerFlag.id,
      {
        name: "Developer Flag Updated",
      },
    ),
  ).resolves.toMatchObject({ id: developerFlag.id, name: "Developer Flag Updated" });
  await expect(
    updateFeatureFlagValueViaApi(
      request,
      developerAuth.sessionToken,
      tenant.config.id,
      developerFlag.id,
      tenant.environment.id,
      { defaultValue: true },
    ),
  ).resolves.toMatchObject({ defaultValue: true, featureFlagId: developerFlag.id });
  await expect(
    deleteFeatureFlagViaApi(
      request,
      developerAuth.sessionToken,
      tenant.config.id,
      developerFlag.id,
    ),
  ).resolves.toEqual({ ok: true });

  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/configs`), {
      data: { key: "developer-config", name: "Developer Config" },
      headers: authHeaders(developerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/environments`), {
      data: { key: "developer-env", name: "Developer Env" },
      headers: authHeaders(developerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/configs/${tenant.config.id}/segments`), {
      data: {
        conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
        key: "developer-segment",
        name: "Developer Segment",
      },
      headers: authHeaders(developerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/sdk-keys`), {
      data: { configId: tenant.config.id, environmentId: tenant.environment.id },
      headers: authHeaders(developerAuth.sessionToken),
    }),
  );
  await expectProjectRoleDenied(
    request.post(apiUrl(`/api/v1/projects/${tenant.project.id}/members`), {
      data: { email: "nobody@capture-flag.test", role: "viewer" },
      headers: authHeaders(developerAuth.sessionToken),
    }),
  );
});

async function createTenantWorkspace(
  request: APIRequestContext,
  input: { configKey: string; projectSlug: string; userEmail: string },
): Promise<TenantWorkspace> {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: `${input.projectSlug} org`,
    organizationSlug: `${input.projectSlug}-org`,
    projectName: `${input.projectSlug} project`,
    projectSlug: input.projectSlug,
    userEmail: input.userEmail,
    userName: `${input.projectSlug} user`,
  });
  const environment = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });
  const config = await createConfigViaApi(request, sessionToken, project.id, {
    key: input.configKey,
    name: input.configKey,
  });

  return { config, environment, organization, project, sessionToken };
}

async function expectProjectRoleDenied(responsePromise: Promise<APIResponse>) {
  await expectForbidden(responsePromise, "Project role is not allowed for this action");
}

async function expectForbidden(responsePromise: Promise<APIResponse>, message: string) {
  const error = await expectJson<ApiError>(await responsePromise, 403);
  expect(error).toMatchObject({ message, statusCode: 403 });
}

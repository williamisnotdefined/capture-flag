import { expect, test } from "@playwright/test";
import { apiDeleteJson, apiGetJson, apiPatchJson, apiUrl, expectJson } from "../support/api";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase, prisma } from "../support/db";
import { resetDatabase } from "../support/reset";
import {
  type Config,
  type Environment,
  type Organization,
  type Project,
  createConfigViaApi,
  createCoreWorkspace,
  createEnvironmentViaApi,
  createOrganizationViaApi,
  createProjectViaApi,
} from "../support/workspace";

type OkResponse = {
  ok: true;
};

type ApiError = {
  error: string;
  message: string;
  statusCode: number;
};

type ConfigPreview = {
  body: {
    configKey: string;
    environment: string;
    flags: Record<string, unknown>;
    projectKey: string;
    revision: number;
    schemaVersion: 1;
  };
  etag: string;
};

test.beforeEach(async () => {
  await resetDatabase();
});

test.afterAll(async () => {
  await disconnectDatabase();
});

test("lists, creates, and gets organizations", async ({ request }) => {
  const { sessionToken } = await createAuthenticatedUser({
    email: "organizations@capture-flag.test",
    name: "Organizations User",
  });

  const initialOrganizations = await apiGetJson<Organization[]>(
    request,
    "/api/v1/organizations",
    sessionToken,
  );
  expect(initialOrganizations).toEqual([]);

  const organization = await createOrganizationViaApi(request, sessionToken, {
    name: "Core Org",
    slug: "core-org",
  });
  expect(organization).toMatchObject({ name: "Core Org", role: "owner", slug: "core-org" });

  const organizations = await apiGetJson<Organization[]>(
    request,
    "/api/v1/organizations",
    sessionToken,
  );
  expect(organizations).toHaveLength(1);
  expect(organizations[0]).toMatchObject({
    id: organization.id,
    name: "Core Org",
    role: "owner",
    slug: "core-org",
  });

  const fetchedOrganization = await apiGetJson<Organization>(
    request,
    `/api/v1/organizations/${organization.id}`,
    sessionToken,
  );
  expect(fetchedOrganization).toMatchObject({
    id: organization.id,
    name: "Core Org",
    role: "owner",
    slug: "core-org",
  });
});

test("lists, gets, updates, and protects audited projects from hard delete", async ({
  request,
}) => {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: "Project Org",
    organizationSlug: "project-org",
    projectName: "Project Alpha",
    projectSlug: "project-alpha",
    userEmail: "projects@capture-flag.test",
    userName: "Projects User",
  });

  const projects = await apiGetJson<Project[]>(
    request,
    `/api/v1/organizations/${organization.id}/projects`,
    sessionToken,
  );
  expect(projects).toHaveLength(1);
  expect(projects[0]).toMatchObject({
    currentUserProjectRole: "project_admin",
    id: project.id,
    name: "Project Alpha",
    organizationId: organization.id,
    slug: "project-alpha",
  });

  const fetchedProject = await apiGetJson<Project>(
    request,
    `/api/v1/projects/${project.id}`,
    sessionToken,
  );
  expect(fetchedProject).toMatchObject({
    id: project.id,
    name: "Project Alpha",
    organizationId: organization.id,
    slug: "project-alpha",
  });
  expect(fetchedProject.configs).toHaveLength(1);
  expect(fetchedProject.configs[0]).toMatchObject({ key: "default", name: "Default" });
  expect(fetchedProject.environments).toEqual([]);

  const updatedProject = await apiPatchJson<Project>(
    request,
    `/api/v1/projects/${project.id}`,
    sessionToken,
    {
      name: "Project Renamed",
      slug: "project-renamed",
    },
  );
  expect(updatedProject).toMatchObject({
    id: project.id,
    name: "Project Renamed",
    slug: "project-renamed",
  });

  const deleteError = await apiDeleteJson<ApiError>(
    request,
    `/api/v1/projects/${project.id}`,
    sessionToken,
    400,
  );
  expect(deleteError).toMatchObject({
    message: "Project has audit history and cannot be hard deleted",
    statusCode: 400,
  });
});

test("hard deletes an audit-free project fixture", async ({ request }) => {
  const { organization, sessionToken, user } = await createCoreWorkspace(request, {
    organizationName: "Delete Project Org",
    organizationSlug: "delete-project-org",
    projectName: "Audited Project",
    projectSlug: "audited-project",
    userEmail: "delete-project@capture-flag.test",
    userName: "Delete Project User",
  });
  const fixtureProject = await prisma.project.create({
    data: {
      name: "Fixture Project",
      organizationId: organization.id,
      slug: "fixture-project",
      members: {
        create: {
          role: "project_admin",
          userId: user.id,
        },
      },
    },
  });

  await expect(
    apiDeleteJson<OkResponse>(request, `/api/v1/projects/${fixtureProject.id}`, sessionToken),
  ).resolves.toEqual({ ok: true });

  const projects = await apiGetJson<Project[]>(
    request,
    `/api/v1/organizations/${organization.id}/projects`,
    sessionToken,
  );
  expect(projects.map((project) => project.id)).not.toContain(fixtureProject.id);
});

test("lists, creates, updates, orders, and deletes environments", async ({ request }) => {
  const { project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: "Environment Org",
    organizationSlug: "environment-org",
    projectName: "Environment Project",
    projectSlug: "environment-project",
    userEmail: "environments@capture-flag.test",
    userName: "Environments User",
  });

  const initialEnvironments = await apiGetJson<Environment[]>(
    request,
    `/api/v1/projects/${project.id}/environments`,
    sessionToken,
  );
  expect(initialEnvironments).toEqual([]);

  const production = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });
  expect(production).toMatchObject({
    key: "production",
    name: "Production",
    projectId: project.id,
    sortOrder: 1,
  });

  const staging = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "staging",
    name: "Staging",
  });
  expect(staging).toMatchObject({
    key: "staging",
    name: "Staging",
    projectId: project.id,
    sortOrder: 2,
  });

  const updatedStaging = await apiPatchJson<Environment>(
    request,
    `/api/v1/environments/${staging.id}`,
    sessionToken,
    {
      key: "preprod",
      name: "Preprod",
      sortOrder: 0,
    },
  );
  expect(updatedStaging).toMatchObject({
    id: staging.id,
    key: "preprod",
    name: "Preprod",
    sortOrder: 0,
  });

  const orderedEnvironments = await apiGetJson<Environment[]>(
    request,
    `/api/v1/projects/${project.id}/environments`,
    sessionToken,
  );
  expect(orderedEnvironments.map((environment) => environment.key)).toEqual([
    "preprod",
    "production",
  ]);

  await expect(
    apiDeleteJson<OkResponse>(request, `/api/v1/environments/${production.id}`, sessionToken),
  ).resolves.toEqual({ ok: true });

  const remainingEnvironments = await apiGetJson<Environment[]>(
    request,
    `/api/v1/projects/${project.id}/environments`,
    sessionToken,
  );
  expect(remainingEnvironments.map((environment) => environment.id)).toEqual([staging.id]);
});

test("lists, creates, previews, and deletes configs according to audit constraints", async ({
  request,
}) => {
  const { defaultConfig, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: "Config Org",
    organizationSlug: "config-org",
    projectName: "Config Project",
    projectSlug: "config-project",
    userEmail: "configs@capture-flag.test",
    userName: "Configs User",
  });
  const environment = await createEnvironmentViaApi(request, sessionToken, project.id, {
    key: "production",
    name: "Production",
  });

  const initialConfigs = await apiGetJson<Config[]>(
    request,
    `/api/v1/projects/${project.id}/configs`,
    sessionToken,
  );
  expect(initialConfigs.map((config) => config.key)).toEqual(["default"]);

  const lastConfigDeleteError = await apiDeleteJson<ApiError>(
    request,
    `/api/v1/configs/${defaultConfig.id}`,
    sessionToken,
    400,
  );
  expect(lastConfigDeleteError).toMatchObject({
    message: "The last config of a project cannot be deleted",
    statusCode: 400,
  });

  const frontendConfig = await createConfigViaApi(request, sessionToken, project.id, {
    description: "Browser-facing config",
    key: "frontend-web",
    name: "Frontend Web",
  });
  expect(frontendConfig).toMatchObject({
    description: "Browser-facing config",
    key: "frontend-web",
    name: "Frontend Web",
    projectId: project.id,
  });

  const preview = await apiGetJson<ConfigPreview>(
    request,
    `/api/v1/configs/${frontendConfig.id}/environments/${environment.id}/config-preview`,
    sessionToken,
  );
  expect(preview.body).toMatchObject({
    configKey: "frontend-web",
    environment: "production",
    flags: {},
    projectKey: "config-project",
    revision: 1,
    schemaVersion: 1,
  });
  expect(preview.etag).toEqual(expect.any(String));

  const auditedConfigDeleteError = await apiDeleteJson<ApiError>(
    request,
    `/api/v1/configs/${frontendConfig.id}`,
    sessionToken,
    400,
  );
  expect(auditedConfigDeleteError).toMatchObject({
    message: "Config has audit history and cannot be hard deleted",
    statusCode: 400,
  });

  const temporaryConfig = await prisma.config.create({
    data: {
      key: "temporary",
      name: "Temporary",
      projectId: project.id,
    },
  });
  await expect(
    apiDeleteJson<OkResponse>(request, `/api/v1/configs/${temporaryConfig.id}`, sessionToken),
  ).resolves.toEqual({ ok: true });

  const finalConfigs = await apiGetJson<Config[]>(
    request,
    `/api/v1/projects/${project.id}/configs`,
    sessionToken,
  );
  expect(finalConfigs.map((config) => config.key)).toEqual(["default", "frontend-web"]);
  expect(finalConfigs.every((config) => config.projectId === project.id)).toBe(true);
});

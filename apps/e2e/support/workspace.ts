import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { apiPostJson } from "./api";
import { createAuthenticatedUser } from "./auth";

export type Organization = {
  id: string;
  name: string;
  role: string;
  slug: string;
};

export type Project = {
  configs: Config[];
  currentUserProjectRole?: string | null;
  environments: Environment[];
  id: string;
  name: string;
  organizationId: string;
  slug: string;
};

export type Environment = {
  id: string;
  key: string;
  name: string;
  projectId: string;
  sortOrder: number;
};

export type Config = {
  description?: string | null;
  id: string;
  key: string;
  name: string;
  projectId: string;
};

type CreateCoreWorkspaceInput = {
  organizationName?: string;
  organizationSlug?: string;
  projectName?: string;
  projectSlug?: string;
  userEmail?: string;
  userName?: string;
};

export async function createOrganizationViaApi(
  request: APIRequestContext,
  sessionToken: string,
  input: { name?: string; slug?: string } = {},
) {
  const id = uniqueId();
  return apiPostJson<Organization>(request, "/api/v1/organizations", sessionToken, {
    name: input.name ?? `E2E Organization ${id}`,
    slug: input.slug ?? `e2e-organization-${id}`,
  });
}

export async function createProjectViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
  input: { name?: string; slug?: string } = {},
) {
  const id = uniqueId();
  return apiPostJson<Project>(
    request,
    `/api/v1/organizations/${organizationId}/projects`,
    sessionToken,
    {
      name: input.name ?? `E2E Project ${id}`,
      slug: input.slug ?? `e2e-project-${id}`,
    },
  );
}

export async function createEnvironmentViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  input: { key?: string; name?: string } = {},
) {
  const id = uniqueId();
  return apiPostJson<Environment>(
    request,
    `/api/v1/projects/${projectId}/environments`,
    sessionToken,
    {
      key: input.key ?? `environment-${id}`,
      name: input.name ?? `Environment ${id}`,
    },
  );
}

export async function createConfigViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  input: { description?: string; key?: string; name?: string } = {},
) {
  const id = uniqueId();
  return apiPostJson<Config>(request, `/api/v1/projects/${projectId}/configs`, sessionToken, {
    description: input.description,
    key: input.key ?? `config-${id}`,
    name: input.name ?? `Config ${id}`,
  });
}

export async function createCoreWorkspace(
  request: APIRequestContext,
  input: CreateCoreWorkspaceInput = {},
) {
  const id = uniqueId();
  const auth = await createAuthenticatedUser({
    email: input.userEmail ?? `workspace-${id}@capture-flag.test`,
    name: input.userName ?? `Workspace User ${id}`,
  });
  const organization = await createOrganizationViaApi(request, auth.sessionToken, {
    name: input.organizationName,
    slug: input.organizationSlug,
  });
  const project = await createProjectViaApi(request, auth.sessionToken, organization.id, {
    name: input.projectName,
    slug: input.projectSlug,
  });

  return {
    ...auth,
    defaultConfig: project.configs[0],
    organization,
    project,
  };
}

function uniqueId() {
  return randomBytes(4).toString("hex");
}

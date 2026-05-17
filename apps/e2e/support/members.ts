import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { apiDeleteJson, apiGetJson, apiPatchJson, apiPostJson } from "./api";
import { prisma } from "./db";

export type OrganizationRole = "owner" | "admin" | "member" | "viewer";
export type ProjectRole = "project_admin" | "developer" | "viewer";

export type MemberUser = {
  email: string | null;
  id: string;
  name: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  role: OrganizationRole;
  user: MemberUser;
  userId: string;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  role: ProjectRole;
  user: MemberUser;
  userId: string;
};

export type AuditLog = {
  action: string;
  actor: MemberUser | null;
  actorUserId: string | null;
  configId: string | null;
  entityId: string;
  entityType: string;
  id: string;
  metadata: unknown;
  newValue: unknown;
  oldValue: unknown;
  organizationId: string;
  projectId: string | null;
};

export type AuditLogList = {
  items: AuditLog[];
  nextCursor: string | null;
};

export type OkResponse = {
  ok: true;
};

export async function createUserViaDb(input: { email?: string; name?: string } = {}) {
  const id = randomBytes(8).toString("hex");
  return prisma.user.create({
    data: {
      email: input.email ?? `member-${id}@capture-flag.test`,
      name: input.name ?? `Member User ${id}`,
    },
  });
}

export async function listOrganizationMembersViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
) {
  return apiGetJson<OrganizationMember[]>(
    request,
    `/api/v1/organizations/${organizationId}/members`,
    sessionToken,
  );
}

export async function addOrganizationMemberViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
  input: { email?: string; role: OrganizationRole; userId?: string },
) {
  return apiPostJson<OrganizationMember>(
    request,
    `/api/v1/organizations/${organizationId}/members`,
    sessionToken,
    input,
  );
}

export async function updateOrganizationMemberViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
  memberId: string,
  input: { role: OrganizationRole },
) {
  return apiPatchJson<OrganizationMember>(
    request,
    `/api/v1/organizations/${organizationId}/members/${memberId}`,
    sessionToken,
    input,
  );
}

export async function removeOrganizationMemberViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
  memberId: string,
) {
  return apiDeleteJson<OkResponse>(
    request,
    `/api/v1/organizations/${organizationId}/members/${memberId}`,
    sessionToken,
  );
}

export async function listProjectMembersViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
) {
  return apiGetJson<ProjectMember[]>(
    request,
    `/api/v1/projects/${projectId}/members`,
    sessionToken,
  );
}

export async function addProjectMemberViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  input: { email?: string; role: ProjectRole; userId?: string },
) {
  return apiPostJson<ProjectMember>(
    request,
    `/api/v1/projects/${projectId}/members`,
    sessionToken,
    input,
  );
}

export async function updateProjectMemberViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  memberId: string,
  input: { role: ProjectRole },
) {
  return apiPatchJson<ProjectMember>(
    request,
    `/api/v1/projects/${projectId}/members/${memberId}`,
    sessionToken,
    input,
  );
}

export async function removeProjectMemberViaApi(
  request: APIRequestContext,
  sessionToken: string,
  projectId: string,
  memberId: string,
) {
  return apiDeleteJson<OkResponse>(
    request,
    `/api/v1/projects/${projectId}/members/${memberId}`,
    sessionToken,
  );
}

export async function listAuditLogsViaApi(
  request: APIRequestContext,
  sessionToken: string,
  organizationId: string,
  query: {
    action?: string;
    cursor?: string;
    entityType?: string;
    limit?: number;
    projectId?: string;
  } = {},
) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return apiGetJson<AuditLogList>(
    request,
    `/api/v1/organizations/${organizationId}/audit-logs${queryString ? `?${queryString}` : ""}`,
    sessionToken,
  );
}

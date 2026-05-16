import { expect, test } from "@playwright/test";
import { apiUrl, authHeaders, expectJson } from "../support/api";
import { createAuthenticatedUser } from "../support/auth";
import { disconnectDatabase } from "../support/db";
import {
  addOrganizationMemberViaApi,
  addProjectMemberViaApi,
  createUserViaDb,
  listAuditLogsViaApi,
  listOrganizationMembersViaApi,
  listProjectMembersViaApi,
  removeOrganizationMemberViaApi,
  removeProjectMemberViaApi,
  updateOrganizationMemberViaApi,
  updateProjectMemberViaApi,
} from "../support/members";
import { resetDatabase } from "../support/reset";
import { createCoreWorkspace, createProjectViaApi } from "../support/workspace";

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

test("manages organization members and records audit logs", async ({ request }) => {
  const { organization, sessionToken, user } = await createCoreWorkspace(request, {
    organizationName: "Organization Members Org",
    organizationSlug: "organization-members-org",
    projectName: "Organization Members Project",
    projectSlug: "organization-members-project",
    userEmail: "org-members-owner@capture-flag.test",
    userName: "Organization Members Owner",
  });
  const targetUser = await createUserViaDb({
    email: "org-member-target@capture-flag.test",
    name: "Organization Member Target",
  });

  const initialMembers = await listOrganizationMembersViaApi(
    request,
    sessionToken,
    organization.id,
  );
  expect(initialMembers).toHaveLength(1);
  expect(initialMembers[0]).toMatchObject({
    organizationId: organization.id,
    role: "owner",
    userId: user.id,
  });

  const addedMember = await addOrganizationMemberViaApi(request, sessionToken, organization.id, {
    email: "ORG-MEMBER-TARGET@capture-flag.test",
    role: "member",
  });
  expect(addedMember).toMatchObject({
    organizationId: organization.id,
    role: "member",
    user: { email: targetUser.email, id: targetUser.id },
    userId: targetUser.id,
  });

  const updatedMember = await updateOrganizationMemberViaApi(
    request,
    sessionToken,
    organization.id,
    addedMember.id,
    { role: "admin" },
  );
  expect(updatedMember).toMatchObject({ id: addedMember.id, role: "admin" });

  await expect(
    removeOrganizationMemberViaApi(request, sessionToken, organization.id, addedMember.id),
  ).resolves.toEqual({ ok: true });
  const finalMembers = await listOrganizationMembersViaApi(request, sessionToken, organization.id);
  expect(finalMembers.map((member) => member.id)).not.toContain(addedMember.id);

  const auditLogs = await listAuditLogsViaApi(request, sessionToken, organization.id, {
    entityType: "organization_member",
  });
  expect(auditLogs.items.map((log) => log.action)).toEqual(
    expect.arrayContaining([
      "organization_member.added",
      "organization_member.updated",
      "organization_member.removed",
    ]),
  );
});

test("enforces organization owner safety and admin owner limitations", async ({ request }) => {
  const { organization, sessionToken } = await createCoreWorkspace(request, {
    organizationName: "Owner Safety Org",
    organizationSlug: "owner-safety-org",
    projectName: "Owner Safety Project",
    projectSlug: "owner-safety-project",
    userEmail: "owner-safety-owner@capture-flag.test",
    userName: "Owner Safety Owner",
  });
  const [ownerMember] = await listOrganizationMembersViaApi(request, sessionToken, organization.id);

  const demoteOnlyOwnerError = await expectJson<ApiError>(
    await request.patch(
      apiUrl(`/api/v1/organizations/${organization.id}/members/${ownerMember.id}`),
      {
        data: { role: "admin" },
        headers: authHeaders(sessionToken),
      },
    ),
    400,
  );
  expect(demoteOnlyOwnerError).toMatchObject({
    message: "Organization must keep at least one owner",
    statusCode: 400,
  });

  const removeOnlyOwnerError = await expectJson<ApiError>(
    await request.delete(
      apiUrl(`/api/v1/organizations/${organization.id}/members/${ownerMember.id}`),
      {
        headers: authHeaders(sessionToken),
      },
    ),
    400,
  );
  expect(removeOnlyOwnerError).toMatchObject({
    message: "Organization must keep at least one owner",
    statusCode: 400,
  });

  const adminAuth = await createAuthenticatedUser({
    email: "org-admin@capture-flag.test",
    name: "Organization Admin",
  });
  const adminMember = await addOrganizationMemberViaApi(request, sessionToken, organization.id, {
    role: "admin",
    userId: adminAuth.user.id,
  });
  expect(adminMember.role).toBe("admin");

  const prospectiveOwner = await createUserViaDb({
    email: "prospective-owner@capture-flag.test",
    name: "Prospective Owner",
  });
  const adminCreateOwnerError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/organizations/${organization.id}/members`), {
      data: { role: "owner", userId: prospectiveOwner.id },
      headers: authHeaders(adminAuth.sessionToken),
    }),
    403,
  );
  expect(adminCreateOwnerError).toMatchObject({
    message: "Admins cannot create or change organization owners",
    statusCode: 403,
  });

  const adminChangeOwnerError = await expectJson<ApiError>(
    await request.patch(
      apiUrl(`/api/v1/organizations/${organization.id}/members/${ownerMember.id}`),
      {
        data: { role: "member" },
        headers: authHeaders(adminAuth.sessionToken),
      },
    ),
    403,
  );
  expect(adminChangeOwnerError).toMatchObject({
    message: "Admins cannot create or change organization owners",
    statusCode: 403,
  });

  const adminRemoveOwnerError = await expectJson<ApiError>(
    await request.delete(
      apiUrl(`/api/v1/organizations/${organization.id}/members/${ownerMember.id}`),
      {
        headers: authHeaders(adminAuth.sessionToken),
      },
    ),
    403,
  );
  expect(adminRemoveOwnerError).toMatchObject({
    message: "Admins cannot remove organization owners",
    statusCode: 403,
  });

  const secondOwner = await createUserViaDb({
    email: "second-owner@capture-flag.test",
    name: "Second Owner",
  });
  const secondOwnerMember = await addOrganizationMemberViaApi(
    request,
    sessionToken,
    organization.id,
    {
      role: "owner",
      userId: secondOwner.id,
    },
  );
  expect(secondOwnerMember.role).toBe("owner");
  await expect(
    updateOrganizationMemberViaApi(request, sessionToken, organization.id, secondOwnerMember.id, {
      role: "admin",
    }),
  ).resolves.toMatchObject({ id: secondOwnerMember.id, role: "admin" });
  await expect(
    removeOrganizationMemberViaApi(request, sessionToken, organization.id, secondOwnerMember.id),
  ).resolves.toEqual({ ok: true });
});

test("manages project members and records project-scoped audit logs", async ({ request }) => {
  const { organization, project, sessionToken, user } = await createCoreWorkspace(request, {
    organizationName: "Project Members Org",
    organizationSlug: "project-members-org",
    projectName: "Project Members Project",
    projectSlug: "project-members-project",
    userEmail: "project-members-owner@capture-flag.test",
    userName: "Project Members Owner",
  });
  const targetUser = await createUserViaDb({
    email: "project-member-target@capture-flag.test",
    name: "Project Member Target",
  });
  await addOrganizationMemberViaApi(request, sessionToken, organization.id, {
    role: "member",
    userId: targetUser.id,
  });

  const initialMembers = await listProjectMembersViaApi(request, sessionToken, project.id);
  expect(initialMembers).toHaveLength(1);
  expect(initialMembers[0]).toMatchObject({
    projectId: project.id,
    role: "project_admin",
    userId: user.id,
  });

  const addedMember = await addProjectMemberViaApi(request, sessionToken, project.id, {
    email: targetUser.email ?? undefined,
    role: "viewer",
  });
  expect(addedMember).toMatchObject({
    projectId: project.id,
    role: "viewer",
    user: { email: targetUser.email, id: targetUser.id },
    userId: targetUser.id,
  });

  const updatedMember = await updateProjectMemberViaApi(
    request,
    sessionToken,
    project.id,
    addedMember.id,
    { role: "developer" },
  );
  expect(updatedMember).toMatchObject({ id: addedMember.id, role: "developer" });

  await expect(
    removeProjectMemberViaApi(request, sessionToken, project.id, addedMember.id),
  ).resolves.toEqual({ ok: true });
  const finalMembers = await listProjectMembersViaApi(request, sessionToken, project.id);
  expect(finalMembers.map((member) => member.id)).not.toContain(addedMember.id);

  const auditLogs = await listAuditLogsViaApi(request, sessionToken, organization.id, {
    entityType: "project_member",
    projectId: project.id,
  });
  expect(auditLogs.items.map((log) => log.action)).toEqual(
    expect.arrayContaining([
      "project_member.added",
      "project_member.updated",
      "project_member.removed",
    ]),
  );
  const firstPage = await listAuditLogsViaApi(request, sessionToken, organization.id, {
    entityType: "project_member",
    limit: 1,
    projectId: project.id,
  });
  expect(firstPage.items).toHaveLength(1);
  expect(firstPage.nextCursor).toEqual(expect.any(String));
});

test("enforces project member organization membership and project scoping", async ({ request }) => {
  const { organization, project, sessionToken } = await createCoreWorkspace(request, {
    organizationName: "Project Member Constraints Org",
    organizationSlug: "project-member-constraints-org",
    projectName: "Project Member Constraints Project",
    projectSlug: "project-member-constraints-project",
    userEmail: "project-member-constraints-owner@capture-flag.test",
    userName: "Project Member Constraints Owner",
  });
  const outsider = await createUserViaDb({
    email: "project-outsider@capture-flag.test",
    name: "Project Outsider",
  });
  const outsiderError = await expectJson<ApiError>(
    await request.post(apiUrl(`/api/v1/projects/${project.id}/members`), {
      data: { role: "viewer", userId: outsider.id },
      headers: authHeaders(sessionToken),
    }),
    403,
  );
  expect(outsiderError).toMatchObject({
    message: "Organization access denied",
    statusCode: 403,
  });

  const targetUser = await createUserViaDb({
    email: "scoped-project-member@capture-flag.test",
    name: "Scoped Project Member",
  });
  await addOrganizationMemberViaApi(request, sessionToken, organization.id, {
    role: "member",
    userId: targetUser.id,
  });
  const secondProject = await createProjectViaApi(request, sessionToken, organization.id, {
    name: "Second Project",
    slug: "second-project",
  });
  const secondProjectMember = await addProjectMemberViaApi(
    request,
    sessionToken,
    secondProject.id,
    {
      role: "viewer",
      userId: targetUser.id,
    },
  );

  const updateWrongProjectError = await expectJson<ApiError>(
    await request.patch(
      apiUrl(`/api/v1/projects/${project.id}/members/${secondProjectMember.id}`),
      {
        data: { role: "developer" },
        headers: authHeaders(sessionToken),
      },
    ),
    404,
  );
  expect(updateWrongProjectError).toMatchObject({
    message: "Project member not found",
    statusCode: 404,
  });

  const removeWrongProjectError = await expectJson<ApiError>(
    await request.delete(
      apiUrl(`/api/v1/projects/${project.id}/members/${secondProjectMember.id}`),
      {
        headers: authHeaders(sessionToken),
      },
    ),
    404,
  );
  expect(removeWrongProjectError).toMatchObject({
    message: "Project member not found",
    statusCode: 404,
  });
});

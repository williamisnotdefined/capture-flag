import { getAuditLogs } from "@api/auditLogs/getAuditLogs/getAuditLogs";
import { getMe } from "@api/auth/getMe/getMe";
import { logout } from "@api/auth/logout/logout";
import { updateMe } from "@api/auth/updateMe/updateMe";
import { bulkDeleteConfigs } from "@api/configs/bulkDeleteConfigs/bulkDeleteConfigs";
import { createConfig } from "@api/configs/createConfig/createConfig";
import { deleteConfig } from "@api/configs/deleteConfig/deleteConfig";
import { getConfigPreview } from "@api/configs/getConfigPreview/getConfigPreview";
import { getProjectConfigs } from "@api/configs/getProjectConfigs/getProjectConfigs";
import { updateConfig } from "@api/configs/updateConfig/updateConfig";
import { bulkDeleteEnvironments } from "@api/environments/bulkDeleteEnvironments/bulkDeleteEnvironments";
import { createEnvironment } from "@api/environments/createEnvironment/createEnvironment";
import { deleteEnvironment } from "@api/environments/deleteEnvironment/deleteEnvironment";
import { getProjectEnvironments } from "@api/environments/getProjectEnvironments/getProjectEnvironments";
import { updateEnvironment } from "@api/environments/updateEnvironment/updateEnvironment";
import { bulkDeleteFeatureFlags } from "@api/featureFlags/bulkDeleteFeatureFlags/bulkDeleteFeatureFlags";
import { createFeatureFlag } from "@api/featureFlags/createFeatureFlag/createFeatureFlag";
import { deleteFeatureFlag } from "@api/featureFlags/deleteFeatureFlag/deleteFeatureFlag";
import { getConfigFeatureFlags } from "@api/featureFlags/getConfigFeatureFlags/getConfigFeatureFlags";
import { getFeatureFlagActivity } from "@api/featureFlags/getFeatureFlagActivity/getFeatureFlagActivity";
import { updateFeatureFlag } from "@api/featureFlags/updateFeatureFlag/updateFeatureFlag";
import { updateFeatureFlagEnvironmentValue } from "@api/featureFlags/updateFeatureFlagEnvironmentValue/updateFeatureFlagEnvironmentValue";
import { addOrganizationMember } from "@api/organizations/addOrganizationMember/addOrganizationMember";
import { bulkDeleteOrganizations } from "@api/organizations/bulkDeleteOrganizations/bulkDeleteOrganizations";
import { bulkRemoveOrganizationMembers } from "@api/organizations/bulkRemoveOrganizationMembers/bulkRemoveOrganizationMembers";
import { createOrganization } from "@api/organizations/createOrganization/createOrganization";
import { deleteOrganization } from "@api/organizations/deleteOrganization/deleteOrganization";
import { getOrganizationMembers } from "@api/organizations/getOrganizationMembers/getOrganizationMembers";
import { removeOrganizationMember } from "@api/organizations/removeOrganizationMember/removeOrganizationMember";
import { updateOrganization } from "@api/organizations/updateOrganization/updateOrganization";
import { updateOrganizationMember } from "@api/organizations/updateOrganizationMember/updateOrganizationMember";
import { addProjectMember } from "@api/projects/addProjectMember/addProjectMember";
import { bulkDeleteProjects } from "@api/projects/bulkDeleteProjects/bulkDeleteProjects";
import { bulkRemoveProjectMembers } from "@api/projects/bulkRemoveProjectMembers/bulkRemoveProjectMembers";
import { createProject } from "@api/projects/createProject/createProject";
import { deleteProject } from "@api/projects/deleteProject/deleteProject";
import { getProjectMembers } from "@api/projects/getProjectMembers/getProjectMembers";
import { getProjects } from "@api/projects/getProjects/getProjects";
import { removeProjectMember } from "@api/projects/removeProjectMember/removeProjectMember";
import { updateProject } from "@api/projects/updateProject/updateProject";
import { updateProjectMember } from "@api/projects/updateProjectMember/updateProjectMember";
import { bulkRevokeSdkKeys } from "@api/sdkKeys/bulkRevokeSdkKeys/bulkRevokeSdkKeys";
import { createSdkKey } from "@api/sdkKeys/createSdkKey/createSdkKey";
import { getProjectSdkKeys } from "@api/sdkKeys/getProjectSdkKeys/getProjectSdkKeys";
import { revokeSdkKey } from "@api/sdkKeys/revokeSdkKey/revokeSdkKey";
import { rotateSdkKey } from "@api/sdkKeys/rotateSdkKey/rotateSdkKey";
import { bulkDeleteSegments } from "@api/segments/bulkDeleteSegments/bulkDeleteSegments";
import { createSegment } from "@api/segments/createSegment/createSegment";
import { deleteSegment } from "@api/segments/deleteSegment/deleteSegment";
import { getConfigSegments } from "@api/segments/getConfigSegments/getConfigSegments";
import { updateSegment } from "@api/segments/updateSegment/updateSegment";
import { describe, it } from "vitest";
import { type ApiRequestCase, expectApiError, expectApiSuccess } from "./requestAssertions";

const requestCases: ApiRequestCase[] = [
  {
    call: getMe,
    name: "getMe",
    path: "/auth/me",
  },
  {
    call: logout,
    method: "POST",
    name: "logout",
    path: "/auth/logout",
  },
  {
    body: { name: "Ana Updated" },
    call: () => updateMe({ name: "Ana Updated" }),
    method: "PATCH",
    name: "updateMe",
    path: "/auth/me",
  },
  {
    call: () =>
      getAuditLogs({
        filters: {
          action: "create",
          actorUserId: "user_ana",
          configId: "cfg_1",
          cursor: "cursor_1",
          entityId: "flag_1",
          entityType: "FeatureFlag",
          limit: 25,
          projectId: "project_1",
        },
        organizationId: "org_1",
      }),
    name: "getAuditLogs",
    path: "/organizations/org_1/audit-logs?action=create&actorUserId=user_ana&configId=cfg_1&cursor=cursor_1&entityId=flag_1&entityType=FeatureFlag&limit=25&projectId=project_1",
  },
  {
    call: () =>
      getAuditLogs({
        filters: { action: "", actorUserId: undefined },
        organizationId: "org_1",
      }),
    name: "getAuditLogs without filters",
    path: "/organizations/org_1/audit-logs",
  },
  {
    call: () => getProjectConfigs("project_1"),
    name: "getProjectConfigs",
    path: "/projects/project_1/configs",
  },
  {
    call: () => getConfigPreview({ configId: "cfg_1", environmentId: "env_1" }),
    name: "getConfigPreview",
    path: "/configs/cfg_1/environments/env_1/config-preview",
  },
  {
    body: { description: "Runtime", name: "Default" },
    call: () => createConfig({ description: "Runtime", name: "Default", projectId: "project_1" }),
    method: "POST",
    name: "createConfig",
    path: "/projects/project_1/configs",
  },
  {
    body: { description: "Updated", name: "Default" },
    call: () => updateConfig({ configId: "cfg_1", description: "Updated", name: "Default" }),
    method: "PATCH",
    name: "updateConfig",
    path: "/configs/cfg_1",
  },
  {
    call: () => deleteConfig("cfg_1"),
    method: "DELETE",
    name: "deleteConfig",
    path: "/configs/cfg_1",
  },
  {
    body: { ids: ["cfg_1", "cfg_2"] },
    call: () => bulkDeleteConfigs({ configIds: ["cfg_1", "cfg_2"], projectId: "project_1" }),
    method: "POST",
    name: "bulkDeleteConfigs",
    path: "/projects/project_1/configs/bulk-delete",
  },
  {
    call: () => getProjectEnvironments("project_1"),
    name: "getProjectEnvironments",
    path: "/projects/project_1/environments",
  },
  {
    body: { name: "Production" },
    call: () => createEnvironment({ name: "Production", projectId: "project_1" }),
    method: "POST",
    name: "createEnvironment",
    path: "/projects/project_1/environments",
  },
  {
    body: { name: "Production" },
    call: () => updateEnvironment({ environmentId: "env_1", name: "Production" }),
    method: "PATCH",
    name: "updateEnvironment",
    path: "/environments/env_1",
  },
  {
    call: () => deleteEnvironment("env_1"),
    method: "DELETE",
    name: "deleteEnvironment",
    path: "/environments/env_1",
  },
  {
    body: { ids: ["env_1", "env_2"] },
    call: () =>
      bulkDeleteEnvironments({ environmentIds: ["env_1", "env_2"], projectId: "project_1" }),
    method: "POST",
    name: "bulkDeleteEnvironments",
    path: "/projects/project_1/environments/bulk-delete",
  },
  {
    call: () => getConfigFeatureFlags("cfg_1"),
    name: "getConfigFeatureFlags",
    path: "/configs/cfg_1/feature-flags",
  },
  {
    call: () =>
      getFeatureFlagActivity({
        configId: "cfg_1",
        cursor: "cursor_1",
        featureFlagId: "flag_1",
        limit: 50,
      }),
    name: "getFeatureFlagActivity",
    path: "/configs/cfg_1/feature-flags/flag_1/activity?cursor=cursor_1&limit=50",
  },
  {
    call: () => getFeatureFlagActivity({ configId: "cfg_1", featureFlagId: "flag_1" }),
    name: "getFeatureFlagActivity without filters",
    path: "/configs/cfg_1/feature-flags/flag_1/activity",
  },
  {
    body: { key: "newCheckout", name: "New checkout", type: "boolean" },
    call: () =>
      createFeatureFlag({
        configId: "cfg_1",
        key: "newCheckout",
        name: "New checkout",
        type: "boolean",
      }),
    method: "POST",
    name: "createFeatureFlag",
    path: "/configs/cfg_1/feature-flags",
  },
  {
    body: { name: "Updated flag" },
    call: () =>
      updateFeatureFlag({ configId: "cfg_1", featureFlagId: "flag_1", name: "Updated flag" }),
    method: "PATCH",
    name: "updateFeatureFlag",
    path: "/configs/cfg_1/feature-flags/flag_1",
  },
  {
    body: { defaultValue: true, percentageAttribute: "identifier" },
    call: () =>
      updateFeatureFlagEnvironmentValue({
        configId: "cfg_1",
        defaultValue: true,
        environmentId: "env_1",
        featureFlagId: "flag_1",
        percentageAttribute: "identifier",
      }),
    method: "PATCH",
    name: "updateFeatureFlagEnvironmentValue",
    path: "/configs/cfg_1/feature-flags/flag_1/environments/env_1/value",
  },
  {
    call: () => deleteFeatureFlag("cfg_1", "flag_1"),
    method: "DELETE",
    name: "deleteFeatureFlag",
    path: "/configs/cfg_1/feature-flags/flag_1",
  },
  {
    body: { ids: ["flag_1", "flag_2"] },
    call: () => bulkDeleteFeatureFlags({ configId: "cfg_1", featureFlagIds: ["flag_1", "flag_2"] }),
    method: "POST",
    name: "bulkDeleteFeatureFlags",
    path: "/configs/cfg_1/feature-flags/bulk-delete",
  },
  {
    call: () => getOrganizationMembers("org_1"),
    name: "getOrganizationMembers",
    path: "/organizations/org_1/members",
  },
  {
    body: { name: "Acme" },
    call: () => createOrganization("Acme"),
    method: "POST",
    name: "createOrganization",
    path: "/organizations",
  },
  {
    body: { email: "ana@example.com", role: "member" },
    call: () =>
      addOrganizationMember({ email: "ana@example.com", organizationId: "org_1", role: "member" }),
    method: "POST",
    name: "addOrganizationMember",
    path: "/organizations/org_1/members",
  },
  {
    body: { role: "admin" },
    call: () =>
      updateOrganizationMember({ memberId: "member_1", organizationId: "org_1", role: "admin" }),
    method: "PATCH",
    name: "updateOrganizationMember",
    path: "/organizations/org_1/members/member_1",
  },
  {
    body: { name: "Acme Updated" },
    call: () => updateOrganization({ name: "Acme Updated", organizationId: "org_1" }),
    method: "PATCH",
    name: "updateOrganization",
    path: "/organizations/org_1",
  },
  {
    call: () => removeOrganizationMember({ memberId: "member_1", organizationId: "org_1" }),
    method: "DELETE",
    name: "removeOrganizationMember",
    path: "/organizations/org_1/members/member_1",
  },
  {
    body: { ids: ["member_1", "member_2"] },
    call: () =>
      bulkRemoveOrganizationMembers({
        memberIds: ["member_1", "member_2"],
        organizationId: "org_1",
      }),
    method: "POST",
    name: "bulkRemoveOrganizationMembers",
    path: "/organizations/org_1/members/bulk-remove",
  },
  {
    call: () => deleteOrganization("org_1"),
    method: "DELETE",
    name: "deleteOrganization",
    path: "/organizations/org_1",
  },
  {
    body: { ids: ["org_1", "org_2"] },
    call: () => bulkDeleteOrganizations(["org_1", "org_2"]),
    method: "POST",
    name: "bulkDeleteOrganizations",
    path: "/organizations/bulk-delete",
  },
  {
    call: () => getProjects("org_1"),
    name: "getProjects",
    path: "/organizations/org_1/projects",
  },
  {
    call: () => getProjectMembers("project_1"),
    name: "getProjectMembers",
    path: "/projects/project_1/members",
  },
  {
    body: { name: "Console" },
    call: () => createProject({ name: "Console", organizationId: "org_1" }),
    method: "POST",
    name: "createProject",
    path: "/organizations/org_1/projects",
  },
  {
    body: { email: "dev@example.com", role: "developer" },
    call: () =>
      addProjectMember({ email: "dev@example.com", projectId: "project_1", role: "developer" }),
    method: "POST",
    name: "addProjectMember",
    path: "/projects/project_1/members",
  },
  {
    body: { role: "viewer" },
    call: () =>
      updateProjectMember({ memberId: "member_1", projectId: "project_1", role: "viewer" }),
    method: "PATCH",
    name: "updateProjectMember",
    path: "/projects/project_1/members/member_1",
  },
  {
    body: { name: "Console Updated" },
    call: () => updateProject({ name: "Console Updated", projectId: "project_1" }),
    method: "PATCH",
    name: "updateProject",
    path: "/projects/project_1",
  },
  {
    call: () => removeProjectMember({ memberId: "member_1", projectId: "project_1" }),
    method: "DELETE",
    name: "removeProjectMember",
    path: "/projects/project_1/members/member_1",
  },
  {
    body: { ids: ["member_1", "member_2"] },
    call: () =>
      bulkRemoveProjectMembers({ memberIds: ["member_1", "member_2"], projectId: "project_1" }),
    method: "POST",
    name: "bulkRemoveProjectMembers",
    path: "/projects/project_1/members/bulk-remove",
  },
  {
    call: () => deleteProject("project_1"),
    method: "DELETE",
    name: "deleteProject",
    path: "/projects/project_1",
  },
  {
    body: { ids: ["project_1", "project_2"] },
    call: () =>
      bulkDeleteProjects({ organizationId: "org_1", projectIds: ["project_1", "project_2"] }),
    method: "POST",
    name: "bulkDeleteProjects",
    path: "/organizations/org_1/projects/bulk-delete",
  },
  {
    call: () => getProjectSdkKeys("project_1"),
    name: "getProjectSdkKeys",
    path: "/projects/project_1/sdk-keys",
  },
  {
    body: { configId: "cfg_1", environmentId: "env_1", name: "Browser SDK" },
    call: () =>
      createSdkKey({
        configId: "cfg_1",
        environmentId: "env_1",
        name: "Browser SDK",
        projectId: "project_1",
      }),
    method: "POST",
    name: "createSdkKey",
    path: "/projects/project_1/sdk-keys",
  },
  {
    body: {},
    call: () => rotateSdkKey("sdk_1"),
    method: "POST",
    name: "rotateSdkKey",
    path: "/sdk-keys/sdk_1/rotate",
  },
  {
    body: {},
    call: () => revokeSdkKey("sdk_1"),
    method: "POST",
    name: "revokeSdkKey",
    path: "/sdk-keys/sdk_1/revoke",
  },
  {
    body: { ids: ["sdk_1", "sdk_2"] },
    call: () => bulkRevokeSdkKeys({ projectId: "project_1", sdkKeyIds: ["sdk_1", "sdk_2"] }),
    method: "POST",
    name: "bulkRevokeSdkKeys",
    path: "/projects/project_1/sdk-keys/bulk-revoke",
  },
  {
    call: () => getConfigSegments("cfg_1"),
    name: "getConfigSegments",
    path: "/configs/cfg_1/segments",
  },
  {
    body: { conditionsJson: [], description: "Beta users", key: "beta", name: "Beta" },
    call: () =>
      createSegment({
        conditionsJson: [],
        configId: "cfg_1",
        description: "Beta users",
        key: "beta",
        name: "Beta",
      }),
    method: "POST",
    name: "createSegment",
    path: "/configs/cfg_1/segments",
  },
  {
    body: { description: "Updated segment", name: "Beta Updated" },
    call: () =>
      updateSegment({
        configId: "cfg_1",
        description: "Updated segment",
        name: "Beta Updated",
        segmentId: "segment_1",
      }),
    method: "PATCH",
    name: "updateSegment",
    path: "/configs/cfg_1/segments/segment_1",
  },
  {
    call: () => deleteSegment({ configId: "cfg_1", segmentId: "segment_1" }),
    method: "DELETE",
    name: "deleteSegment",
    path: "/configs/cfg_1/segments/segment_1",
  },
  {
    body: { ids: ["segment_1", "segment_2"] },
    call: () => bulkDeleteSegments({ configId: "cfg_1", segmentIds: ["segment_1", "segment_2"] }),
    method: "POST",
    name: "bulkDeleteSegments",
    path: "/configs/cfg_1/segments/bulk-delete",
  },
];

describe("client API request functions", () => {
  it.each(requestCases)("$name sends the expected request on success", expectApiSuccess);
  it.each(requestCases)("$name surfaces API errors", expectApiError);
});

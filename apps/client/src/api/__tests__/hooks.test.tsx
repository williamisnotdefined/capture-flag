import { useGetAuditLogs } from "@api/auditLogs/getAuditLogs/useGetAuditLogs";
import { useDeleteMe } from "@api/auth/deleteMe/useDeleteMe";
import { useGetMe } from "@api/auth/getMe/useGetMe";
import { useLogout } from "@api/auth/logout/useLogout";
import { useUpdateMe } from "@api/auth/updateMe/useUpdateMe";
import { useBulkDeleteConfigs } from "@api/configs/bulkDeleteConfigs/useBulkDeleteConfigs";
import { useCreateConfig } from "@api/configs/createConfig/useCreateConfig";
import { useDeleteConfig } from "@api/configs/deleteConfig/useDeleteConfig";
import { useGetConfigPreview } from "@api/configs/getConfigPreview/useGetConfigPreview";
import { useGetProjectConfigs } from "@api/configs/getProjectConfigs/useGetProjectConfigs";
import { useUpdateConfig } from "@api/configs/updateConfig/useUpdateConfig";
import { useBulkDeleteEnvironments } from "@api/environments/bulkDeleteEnvironments/useBulkDeleteEnvironments";
import { useCreateEnvironment } from "@api/environments/createEnvironment/useCreateEnvironment";
import { useDeleteEnvironment } from "@api/environments/deleteEnvironment/useDeleteEnvironment";
import { useGetProjectEnvironments } from "@api/environments/getProjectEnvironments/useGetProjectEnvironments";
import { useUpdateEnvironment } from "@api/environments/updateEnvironment/useUpdateEnvironment";
import { useBulkDeleteFeatureFlags } from "@api/featureFlags/bulkDeleteFeatureFlags/useBulkDeleteFeatureFlags";
import { useCreateFeatureFlag } from "@api/featureFlags/createFeatureFlag/useCreateFeatureFlag";
import { useDeleteFeatureFlag } from "@api/featureFlags/deleteFeatureFlag/useDeleteFeatureFlag";
import { useGetConfigFeatureFlags } from "@api/featureFlags/getConfigFeatureFlags/useGetConfigFeatureFlags";
import { useGetFeatureFlagActivity } from "@api/featureFlags/getFeatureFlagActivity/useGetFeatureFlagActivity";
import { useUpdateFeatureFlag } from "@api/featureFlags/updateFeatureFlag/useUpdateFeatureFlag";
import { useUpdateFeatureFlagEnvironmentValue } from "@api/featureFlags/updateFeatureFlagEnvironmentValue/useUpdateFeatureFlagEnvironmentValue";
import { useAddOrganizationMember } from "@api/organizations/addOrganizationMember/useAddOrganizationMember";
import { useBulkDeleteOrganizations } from "@api/organizations/bulkDeleteOrganizations/useBulkDeleteOrganizations";
import { useBulkRemoveOrganizationMembers } from "@api/organizations/bulkRemoveOrganizationMembers/useBulkRemoveOrganizationMembers";
import { useCreateOrganization } from "@api/organizations/createOrganization/useCreateOrganization";
import { useDeleteOrganization } from "@api/organizations/deleteOrganization/useDeleteOrganization";
import { useGetOrganizationMembers } from "@api/organizations/getOrganizationMembers/useGetOrganizationMembers";
import { useRemoveOrganizationMember } from "@api/organizations/removeOrganizationMember/useRemoveOrganizationMember";
import { useUpdateOrganization } from "@api/organizations/updateOrganization/useUpdateOrganization";
import { useUpdateOrganizationMember } from "@api/organizations/updateOrganizationMember/useUpdateOrganizationMember";
import { useAddProjectMember } from "@api/projects/addProjectMember/useAddProjectMember";
import { useBulkDeleteProjects } from "@api/projects/bulkDeleteProjects/useBulkDeleteProjects";
import { useBulkRemoveProjectMembers } from "@api/projects/bulkRemoveProjectMembers/useBulkRemoveProjectMembers";
import { useCreateProject } from "@api/projects/createProject/useCreateProject";
import { useDeleteProject } from "@api/projects/deleteProject/useDeleteProject";
import { useGetProjectMembers } from "@api/projects/getProjectMembers/useGetProjectMembers";
import { useGetProjects } from "@api/projects/getProjects/useGetProjects";
import { useRemoveProjectMember } from "@api/projects/removeProjectMember/useRemoveProjectMember";
import { useUpdateProject } from "@api/projects/updateProject/useUpdateProject";
import { useUpdateProjectMember } from "@api/projects/updateProjectMember/useUpdateProjectMember";
import { useBulkRevokeSdkKeys } from "@api/sdkKeys/bulkRevokeSdkKeys/useBulkRevokeSdkKeys";
import { useCreateSdkKey } from "@api/sdkKeys/createSdkKey/useCreateSdkKey";
import { useGetProjectSdkKeys } from "@api/sdkKeys/getProjectSdkKeys/useGetProjectSdkKeys";
import { useRevokeSdkKey } from "@api/sdkKeys/revokeSdkKey/useRevokeSdkKey";
import { useRotateSdkKey } from "@api/sdkKeys/rotateSdkKey/useRotateSdkKey";
import { useBulkDeleteSegments } from "@api/segments/bulkDeleteSegments/useBulkDeleteSegments";
import { useCreateSegment } from "@api/segments/createSegment/useCreateSegment";
import { useDeleteSegment } from "@api/segments/deleteSegment/useDeleteSegment";
import { useGetConfigSegments } from "@api/segments/getConfigSegments/useGetConfigSegments";
import { useUpdateSegment } from "@api/segments/updateSegment/useUpdateSegment";
import { mockApiError, mockApiSuccess } from "@src/test/api";
import { renderHookWithProviders } from "@src/test/render";
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type QueryHookResult = {
  data: unknown;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
};

type MutationHookResult = {
  error: Error | null;
  mutateAsync: (input?: unknown) => Promise<unknown>;
};

type QueryHookCase = {
  infinite?: boolean;
  hook: () => unknown;
  name: string;
  payload: unknown;
};

type MutationHookCase = {
  hook: (onSuccess: (value: unknown) => void) => unknown;
  input?: unknown;
  name: string;
  payload: unknown;
  validatesCacheUpdate?: boolean;
};

const listPayload = [{ id: "item_1" }];
const resourcePayload = { id: "resource_1" };
const auditLogPayload = { items: [{ id: "audit_1" }], nextCursor: null };

const queryHookCases: QueryHookCase[] = [
  {
    hook: useGetMe,
    name: "useGetMe",
    payload: {
      organizations: [],
      user: { email: null, id: "user_1", name: "Ana" },
    },
  },
  {
    hook: () => useGetAuditLogs({ filters: { limit: 25 }, organizationId: "org_1" }),
    infinite: true,
    name: "useGetAuditLogs",
    payload: auditLogPayload,
  },
  {
    hook: () => useGetProjectConfigs("project_1"),
    name: "useGetProjectConfigs",
    payload: listPayload,
  },
  {
    hook: () => useGetConfigPreview({ configId: "cfg_1", environmentId: "env_1" }),
    name: "useGetConfigPreview",
    payload: resourcePayload,
  },
  {
    hook: () => useGetProjectEnvironments("project_1"),
    name: "useGetProjectEnvironments",
    payload: listPayload,
  },
  {
    hook: () => useGetConfigFeatureFlags("cfg_1"),
    name: "useGetConfigFeatureFlags",
    payload: listPayload,
  },
  {
    hook: () => useGetFeatureFlagActivity({ configId: "cfg_1", featureFlagId: "flag_1" }),
    infinite: true,
    name: "useGetFeatureFlagActivity",
    payload: auditLogPayload,
  },
  {
    hook: () => useGetOrganizationMembers("org_1"),
    name: "useGetOrganizationMembers",
    payload: listPayload,
  },
  {
    hook: () => useGetProjects("org_1"),
    name: "useGetProjects",
    payload: listPayload,
  },
  {
    hook: () => useGetProjectMembers("project_1"),
    name: "useGetProjectMembers",
    payload: listPayload,
  },
  {
    hook: () => useGetProjectSdkKeys("project_1"),
    name: "useGetProjectSdkKeys",
    payload: listPayload,
  },
  {
    hook: () => useGetConfigSegments("cfg_1"),
    name: "useGetConfigSegments",
    payload: listPayload,
  },
];

const mutationHookCases: MutationHookCase[] = [
  {
    hook: (onSuccess) => useLogout({ onSuccess: () => onSuccess(undefined) }),
    name: "useLogout",
    payload: { ok: true },
    validatesCacheUpdate: false,
  },
  {
    hook: (onSuccess) => useDeleteMe({ onSuccess: () => onSuccess(undefined) }),
    name: "useDeleteMe",
    payload: { ok: true },
    validatesCacheUpdate: false,
  },
  {
    hook: (onSuccess) => useUpdateMe({ onSuccess: () => onSuccess(undefined) }),
    input: { name: "Ana Updated" },
    name: "useUpdateMe",
    payload: { email: "ana@example.com", id: "user_1", name: "Ana Updated" },
  },
  {
    hook: (onSuccess) => useCreateConfig({ onSuccess, projectId: "project_1" }),
    input: { description: "Runtime", name: "Default" },
    name: "useCreateConfig",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useUpdateConfig({ onSuccess, projectId: "project_1" }),
    input: { configId: "cfg_1", name: "Default" },
    name: "useUpdateConfig",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) =>
      useDeleteConfig({ onSuccess: () => onSuccess(undefined), projectId: "project_1" }),
    input: "cfg_1",
    name: "useDeleteConfig",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkDeleteConfigs({ onSuccess: () => onSuccess(undefined), projectId: "project_1" }),
    input: ["cfg_1", "cfg_2"],
    name: "useBulkDeleteConfigs",
    payload: { count: 2, ok: true },
  },
  {
    hook: (onSuccess) => useCreateEnvironment({ onSuccess, projectId: "project_1" }),
    input: "Production",
    name: "useCreateEnvironment",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useUpdateEnvironment({ onSuccess, projectId: "project_1" }),
    input: { environmentId: "env_1", name: "Production" },
    name: "useUpdateEnvironment",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) =>
      useDeleteEnvironment({ onSuccess: () => onSuccess(undefined), projectId: "project_1" }),
    input: "env_1",
    name: "useDeleteEnvironment",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkDeleteEnvironments({ onSuccess: () => onSuccess(undefined), projectId: "project_1" }),
    input: ["env_1", "env_2"],
    name: "useBulkDeleteEnvironments",
    payload: { count: 2, ok: true },
  },
  {
    hook: (onSuccess) => useCreateFeatureFlag({ configId: "cfg_1", onSuccess }),
    input: { key: "newCheckout", name: "New checkout", type: "boolean" },
    name: "useCreateFeatureFlag",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useUpdateFeatureFlag({ configId: "cfg_1", onSuccess }),
    input: { featureFlagId: "flag_1", name: "Updated flag" },
    name: "useUpdateFeatureFlag",
    payload: resourcePayload,
  },
  {
    hook: () => useUpdateFeatureFlagEnvironmentValue({ configId: "cfg_1" }),
    input: { defaultValue: true, environmentId: "env_1", featureFlagId: "flag_1" },
    name: "useUpdateFeatureFlagEnvironmentValue",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) =>
      useDeleteFeatureFlag({ configId: "cfg_1", onSuccess: () => onSuccess(undefined) }),
    input: "flag_1",
    name: "useDeleteFeatureFlag",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkDeleteFeatureFlags({ configId: "cfg_1", onSuccess: () => onSuccess(undefined) }),
    input: ["flag_1", "flag_2"],
    name: "useBulkDeleteFeatureFlags",
    payload: { count: 2, ok: true },
  },
  {
    hook: (onSuccess) => useCreateOrganization({ onSuccess }),
    input: "Acme",
    name: "useCreateOrganization",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useUpdateOrganization({ onSuccess }),
    input: { name: "Acme Updated", organizationId: "org_1" },
    name: "useUpdateOrganization",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useDeleteOrganization({ onSuccess: () => onSuccess(undefined) }),
    input: "org_1",
    name: "useDeleteOrganization",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) => useBulkDeleteOrganizations({ onSuccess: () => onSuccess(undefined) }),
    input: ["org_1", "org_2"],
    name: "useBulkDeleteOrganizations",
    payload: { count: 2, ok: true },
  },
  {
    hook: () => useAddOrganizationMember("org_1"),
    input: { email: "ana@example.com", role: "member" },
    name: "useAddOrganizationMember",
    payload: resourcePayload,
  },
  {
    hook: () => useUpdateOrganizationMember("org_1"),
    input: { memberId: "member_1", role: "admin" },
    name: "useUpdateOrganizationMember",
    payload: resourcePayload,
  },
  {
    hook: () => useRemoveOrganizationMember("org_1"),
    input: { memberId: "member_1" },
    name: "useRemoveOrganizationMember",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkRemoveOrganizationMembers({
        onSuccess: () => onSuccess(undefined),
        organizationId: "org_1",
      }),
    input: { memberIds: ["member_1", "member_2"] },
    name: "useBulkRemoveOrganizationMembers",
    payload: { count: 2, ok: true },
  },
  {
    hook: (onSuccess) => useCreateProject({ onSuccess, organizationId: "org_1" }),
    input: "Console",
    name: "useCreateProject",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useUpdateProject({ onSuccess, organizationId: "org_1" }),
    input: { name: "Console Updated", projectId: "project_1" },
    name: "useUpdateProject",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) =>
      useDeleteProject({ onSuccess: () => onSuccess(undefined), organizationId: "org_1" }),
    input: "project_1",
    name: "useDeleteProject",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkDeleteProjects({ onSuccess: () => onSuccess(undefined), organizationId: "org_1" }),
    input: ["project_1", "project_2"],
    name: "useBulkDeleteProjects",
    payload: { count: 2, ok: true },
  },
  {
    hook: () => useAddProjectMember("project_1"),
    input: { email: "dev@example.com", role: "developer" },
    name: "useAddProjectMember",
    payload: resourcePayload,
  },
  {
    hook: () => useUpdateProjectMember("project_1"),
    input: { memberId: "member_1", role: "viewer" },
    name: "useUpdateProjectMember",
    payload: resourcePayload,
  },
  {
    hook: () => useRemoveProjectMember("project_1"),
    input: { memberId: "member_1" },
    name: "useRemoveProjectMember",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkRemoveProjectMembers({
        onSuccess: () => onSuccess(undefined),
        projectId: "project_1",
      }),
    input: { memberIds: ["member_1", "member_2"] },
    name: "useBulkRemoveProjectMembers",
    payload: { count: 2, ok: true },
  },
  {
    hook: (onSuccess) => useCreateSdkKey({ onSuccess, projectId: "project_1" }),
    input: { configId: "cfg_1", environmentId: "env_1", name: "Browser SDK" },
    name: "useCreateSdkKey",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) => useRotateSdkKey({ onSuccess, projectId: "project_1" }),
    input: "sdk_1",
    name: "useRotateSdkKey",
    payload: resourcePayload,
  },
  {
    hook: () => useRevokeSdkKey({ projectId: "project_1" }),
    input: "sdk_1",
    name: "useRevokeSdkKey",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) =>
      useBulkRevokeSdkKeys({ onSuccess: () => onSuccess(undefined), projectId: "project_1" }),
    input: ["sdk_1", "sdk_2"],
    name: "useBulkRevokeSdkKeys",
    payload: { count: 2, ok: true },
  },
  {
    hook: (onSuccess) => useCreateSegment({ configId: "cfg_1", onSuccess }),
    input: { conditionsJson: [], key: "beta", name: "Beta" },
    name: "useCreateSegment",
    payload: resourcePayload,
  },
  {
    hook: () => useUpdateSegment({ configId: "cfg_1" }),
    input: { name: "Beta Updated", segmentId: "segment_1" },
    name: "useUpdateSegment",
    payload: resourcePayload,
  },
  {
    hook: (onSuccess) =>
      useDeleteSegment({ configId: "cfg_1", onSuccess: () => onSuccess(undefined) }),
    input: "segment_1",
    name: "useDeleteSegment",
    payload: { ok: true },
  },
  {
    hook: (onSuccess) =>
      useBulkDeleteSegments({ configId: "cfg_1", onSuccess: () => onSuccess(undefined) }),
    input: ["segment_1", "segment_2"],
    name: "useBulkDeleteSegments",
    payload: { count: 2, ok: true },
  },
];

describe("client API query hooks", () => {
  it.each(queryHookCases)("$name resolves API data", async ({ hook, infinite, payload }) => {
    mockApiSuccess(payload);

    const { result } = renderHookWithProviders(() => hook());

    await waitFor(() => expect((result.current as QueryHookResult).isSuccess).toBe(true));

    const data = (result.current as QueryHookResult).data;

    expect(infinite ? (data as { pages: unknown[] }).pages[0] : data).toEqual(payload);
  });

  it.each(queryHookCases)("$name exposes API errors", async ({ hook }) => {
    mockApiError({ message: "Query failed" }, 500);

    const { result } = renderHookWithProviders(() => hook());

    await waitFor(() => expect((result.current as QueryHookResult).isError).toBe(true));
    expect((result.current as QueryHookResult).error).toEqual(new Error("Query failed"));
  });

  it("does not call the API when a required query id is missing", () => {
    const fetchMock = mockApiSuccess(listPayload);

    renderHookWithProviders(() => useGetProjects(""));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("client API mutation hooks", () => {
  it.each(mutationHookCases)(
    "$name resolves API data and updates cache state",
    async ({ hook, input, payload, validatesCacheUpdate = true }) => {
      mockApiSuccess(payload);
      const onSuccess = vi.fn();
      const { queryClient, result } = renderHookWithProviders(() => hook(onSuccess));
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
      const clear = vi.spyOn(queryClient, "clear");

      await act(async () => {
        await expect((result.current as MutationHookResult).mutateAsync(input)).resolves.toEqual(
          payload,
        );
      });

      if (validatesCacheUpdate) {
        expect(invalidateQueries).toHaveBeenCalled();
      } else {
        expect(clear).toHaveBeenCalled();
      }

      if (hook.length > 0) {
        expect(onSuccess).toHaveBeenCalled();
      }
    },
  );

  it.each(mutationHookCases)("$name exposes API errors", async ({ hook, input }) => {
    mockApiError({ message: "Mutation failed" }, 500);

    const { result } = renderHookWithProviders(() => hook(vi.fn()));

    await act(async () => {
      await expect((result.current as MutationHookResult).mutateAsync(input)).rejects.toThrow(
        "Mutation failed",
      );
    });
  });
});

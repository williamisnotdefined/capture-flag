import { type MockApiRoute, mockApiRoutes } from "@src/test/api";
import {
  storyAuditLogs,
  storyConfigPreview,
  storyConfigs,
  storyEnvironments,
  storyFeatureFlags,
  storyMe,
  storyOrganizationMembers,
  storyOrganizations,
  storyProjectMembers,
  storyProjects,
  storySdkKeys,
  storySegments,
} from "@stories/mockData";

export const accountRoutePath = "/account";
export const organizationRoutePath = "/organizations/:organizationId";
export const organizationsRoutePath = "/organizations";
export const projectsRoutePath = "/organizations/:organizationId/projects";
export const projectRoutePath = "/organizations/:organizationId/projects/:projectId";
export const environmentsRoutePath =
  "/organizations/:organizationId/projects/:projectId/environments";
export const configsRoutePath =
  "/organizations/:organizationId/projects/:projectId/configs/:configId";
export const flagsRoutePath =
  "/organizations/:organizationId/projects/:projectId/configs/:configId/flags";
export const segmentsRoutePath =
  "/organizations/:organizationId/projects/:projectId/configs/:configId/segments";
export const sdkKeysRoutePath = "/organizations/:organizationId/projects/:projectId/sdk-keys";
export const auditLogsRoutePath = "/organizations/:organizationId/audit-logs";

const defaultApiRoutes: MockApiRoute[] = [
  { path: "/auth/me", payload: storyMe },
  { path: "/auth/me", payload: { ...storyMe.user, name: "Ana Atualizada" }, method: "PATCH" },
  { path: "/auth/me", payload: { ok: true }, method: "DELETE" },
  { path: "/organizations", payload: storyOrganizations, method: "POST" },
  { path: "/organizations/bulk-delete", payload: { count: 1, ok: true }, method: "POST" },
  { path: /^\/organizations\/[^/]+$/, payload: storyOrganizations[0], method: "PATCH" },
  { path: /^\/organizations\/[^/]+$/, payload: { ok: true }, method: "DELETE" },
  { path: /^\/organizations\/[^/]+\/projects$/, payload: storyProjects },
  { path: /^\/organizations\/[^/]+\/projects$/, payload: storyProjects[0], method: "POST" },
  {
    path: /^\/organizations\/[^/]+\/projects\/bulk-delete$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  { path: /^\/organizations\/[^/]+\/members$/, payload: storyOrganizationMembers },
  {
    path: /^\/organizations\/[^/]+\/members$/,
    payload: storyOrganizationMembers[1],
    method: "POST",
  },
  {
    path: /^\/organizations\/[^/]+\/members\/[^/]+$/,
    payload: storyOrganizationMembers[1],
    method: "PATCH",
  },
  {
    path: /^\/organizations\/[^/]+\/members\/[^/]+$/,
    payload: { ok: true },
    method: "DELETE",
  },
  {
    path: /^\/organizations\/[^/]+\/members\/bulk-remove$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  {
    path: /^\/organizations\/[^/]+\/audit-logs$/,
    payload: { items: storyAuditLogs, nextCursor: null },
  },
  { path: /^\/projects\/[^/]+$/, payload: storyProjects[0], method: "PATCH" },
  { path: /^\/projects\/[^/]+$/, payload: { ok: true }, method: "DELETE" },
  { path: /^\/projects\/[^/]+\/configs$/, payload: storyConfigs },
  { path: /^\/projects\/[^/]+\/configs$/, payload: storyConfigs[0], method: "POST" },
  {
    path: /^\/projects\/[^/]+\/configs\/bulk-delete$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  { path: /^\/projects\/[^/]+\/environments$/, payload: storyEnvironments },
  { path: /^\/projects\/[^/]+\/environments$/, payload: storyEnvironments[0], method: "POST" },
  {
    path: /^\/projects\/[^/]+\/environments\/bulk-delete$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  { path: /^\/projects\/[^/]+\/sdk-keys$/, payload: storySdkKeys },
  {
    path: /^\/projects\/[^/]+\/sdk-keys$/,
    payload: { ...storySdkKeys[0], key: "cf_prod_full_test_key" },
    method: "POST",
  },
  { path: /^\/projects\/[^/]+\/members$/, payload: storyProjectMembers },
  { path: /^\/projects\/[^/]+\/members$/, payload: storyProjectMembers[1], method: "POST" },
  {
    path: /^\/projects\/[^/]+\/members\/bulk-remove$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  {
    path: /^\/projects\/[^/]+\/members\/[^/]+$/,
    payload: storyProjectMembers[1],
    method: "PATCH",
  },
  { path: /^\/projects\/[^/]+\/members\/[^/]+$/, payload: { ok: true }, method: "DELETE" },
  {
    path: /^\/configs\/[^/]+\/environments\/[^/]+\/config-preview$/,
    payload: storyConfigPreview,
  },
  { path: /^\/configs\/[^/]+$/, payload: storyConfigs[0], method: "PATCH" },
  { path: /^\/configs\/[^/]+$/, payload: { ok: true }, method: "DELETE" },
  { path: /^\/environments\/[^/]+$/, payload: storyEnvironments[0], method: "PATCH" },
  { path: /^\/environments\/[^/]+$/, payload: { ok: true }, method: "DELETE" },
  { path: /^\/configs\/[^/]+\/feature-flags$/, payload: storyFeatureFlags },
  {
    path: /^\/configs\/[^/]+\/feature-flags$/,
    payload: storyFeatureFlags[0],
    method: "POST",
  },
  {
    path: /^\/configs\/[^/]+\/feature-flags\/bulk-delete$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  {
    path: /^\/configs\/[^/]+\/feature-flags\/[^/]+$/,
    payload: storyFeatureFlags[0],
    method: "PATCH",
  },
  {
    path: /^\/configs\/[^/]+\/feature-flags\/[^/]+$/,
    payload: { ok: true },
    method: "DELETE",
  },
  {
    path: /^\/configs\/[^/]+\/feature-flags\/[^/]+\/activity$/,
    payload: { items: storyAuditLogs, nextCursor: null },
  },
  {
    path: /^\/configs\/[^/]+\/feature-flags\/[^/]+\/environments\/[^/]+\/value$/,
    payload: storyFeatureFlags[0].environmentValues[0],
    method: "PATCH",
  },
  { path: /^\/configs\/[^/]+\/segments$/, payload: storySegments },
  { path: /^\/configs\/[^/]+\/segments$/, payload: storySegments[0], method: "POST" },
  {
    path: /^\/configs\/[^/]+\/segments\/bulk-delete$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
  { path: /^\/configs\/[^/]+\/segments\/[^/]+$/, payload: storySegments[0], method: "PATCH" },
  {
    path: /^\/configs\/[^/]+\/segments\/[^/]+$/,
    payload: { ok: true },
    method: "DELETE",
  },
  {
    path: /^\/sdk-keys\/[^/]+\/rotate$/,
    payload: { ...storySdkKeys[0], key: "cf_prod_rotated_test_key" },
    method: "POST",
  },
  { path: /^\/sdk-keys\/[^/]+\/revoke$/, payload: storySdkKeys[0], method: "POST" },
  {
    path: /^\/projects\/[^/]+\/sdk-keys\/bulk-revoke$/,
    payload: { count: 1, ok: true },
    method: "POST",
  },
];

export function mockDefaultApiRoutes(overrides: readonly MockApiRoute[] = []) {
  return mockApiRoutes([...overrides, ...defaultApiRoutes]);
}

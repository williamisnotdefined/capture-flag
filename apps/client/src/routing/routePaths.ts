export const configSearchParam = "configId";
export const environmentSearchParam = "environmentId";
export const projectSearchParam = "projectId";
export const accountPath = "/account";

export function organizationPath(organizationId: string) {
  return organizationId ? `/organizations/${organizationId}` : "/organizations";
}

export function projectsPath(organizationId: string, projectId = "") {
  if (!organizationId) {
    return "/organizations";
  }

  return projectId
    ? `/organizations/${organizationId}/projects/${projectId}`
    : `/organizations/${organizationId}/projects`;
}

export function environmentsPath(organizationId: string, projectId: string) {
  return projectId
    ? `/organizations/${organizationId}/projects/${projectId}/environments`
    : projectsPath(organizationId);
}

export function configsPath(organizationId: string, projectId: string, configId = "") {
  if (!projectId) {
    return projectsPath(organizationId);
  }

  return configId
    ? `/organizations/${organizationId}/projects/${projectId}/configs/${configId}`
    : `/organizations/${organizationId}/projects/${projectId}/configs`;
}

export function flagsPath(organizationId: string, projectId: string, configId: string) {
  return configId
    ? `/organizations/${organizationId}/projects/${projectId}/configs/${configId}/flags`
    : configsPath(organizationId, projectId);
}

export function segmentsPath(organizationId: string, projectId: string, configId: string) {
  return configId
    ? `/organizations/${organizationId}/projects/${projectId}/configs/${configId}/segments`
    : configsPath(organizationId, projectId);
}

export function sdkKeysPath(
  organizationId: string,
  projectId: string,
  configId = "",
  environmentId = "",
) {
  if (!projectId) {
    return projectsPath(organizationId);
  }

  const searchParams = new URLSearchParams();
  if (configId) {
    searchParams.set(configSearchParam, configId);
  }
  if (environmentId) {
    searchParams.set(environmentSearchParam, environmentId);
  }

  return withSearch(
    `/organizations/${organizationId}/projects/${projectId}/sdk-keys`,
    searchParams,
  );
}

export function auditLogsPath(organizationId: string, projectId = "") {
  if (!organizationId) {
    return "/organizations";
  }

  const searchParams = new URLSearchParams();
  if (projectId) {
    searchParams.set(projectSearchParam, projectId);
  }

  return withSearch(`/organizations/${organizationId}/audit-logs`, searchParams);
}

export function withSearch(path: string, searchParams: URLSearchParams) {
  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function setSearchValue(searchParams: URLSearchParams, key: string, value: string) {
  const nextSearchParams = new URLSearchParams(searchParams);
  if (value) {
    nextSearchParams.set(key, value);
  } else {
    nextSearchParams.delete(key);
  }

  return nextSearchParams;
}

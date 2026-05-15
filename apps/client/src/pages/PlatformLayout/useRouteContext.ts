import { useParams, useSearchParams } from "react-router-dom";
import { useGetMe } from "../../api/auth";
import { useGetProjectConfigs } from "../../api/configs";
import { useGetProjectEnvironments } from "../../api/environments";
import { useGetProjects } from "../../api/projects";
import {
  configSearchParam,
  environmentSearchParam,
  projectSearchParam,
  setSearchValue,
} from "./routePaths";

export function useOrganizationRouteContext() {
  const { organizationId = "" } = useParams();
  const meQuery = useGetMe();
  const organizations = meQuery.data?.organizations ?? [];
  const selectedOrganization = organizationId
    ? organizations.find((organization) => organization.id === organizationId)
    : organizations[0];
  const selectedOrganizationId = selectedOrganization?.id ?? organizationId;

  return {
    meQuery,
    organizationRole: selectedOrganization?.role ?? null,
    organizations,
    selectedOrganization,
    selectedOrganizationId,
  };
}

export function useProjectRouteContext() {
  const { projectId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const organizationContext = useOrganizationRouteContext();
  const projectsQuery = useGetProjects(organizationContext.selectedOrganizationId);
  const projects = projectsQuery.data ?? [];
  const requestedProjectId = projectId || (searchParams.get(projectSearchParam) ?? "");
  const selectedProject = requestedProjectId
    ? projects.find((project) => project.id === requestedProjectId)
    : projects[0];
  const selectedProjectId = selectedProject?.id ?? requestedProjectId;

  return {
    ...organizationContext,
    projects,
    projectsQuery,
    selectedProject,
    selectedProjectId,
  };
}

export function useProjectResourcesRouteContext() {
  const { configId: routeConfigId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectContext = useProjectRouteContext();
  const configsQuery = useGetProjectConfigs(projectContext.selectedProjectId);
  const environmentsQuery = useGetProjectEnvironments(projectContext.selectedProjectId);
  const configs = configsQuery.data ?? [];
  const environments = environmentsQuery.data ?? [];
  const searchConfigId = searchParams.get(configSearchParam) ?? "";
  const requestedConfigId = routeConfigId || searchConfigId;
  const selectedConfig = requestedConfigId
    ? configs.find((config) => config.id === requestedConfigId)
    : configs[0];
  const selectedConfigId = selectedConfig?.id ?? requestedConfigId;
  const searchEnvironmentId = searchParams.get(environmentSearchParam) ?? "";
  const selectedEnvironment = searchEnvironmentId
    ? environments.find((environment) => environment.id === searchEnvironmentId)
    : environments[0];
  const selectedEnvironmentId = selectedEnvironment?.id ?? searchEnvironmentId;

  function setSelectedEnvironmentId(environmentId: string) {
    setSearchParams(setSearchValue(searchParams, environmentSearchParam, environmentId));
  }

  return {
    ...projectContext,
    configs,
    configsQuery,
    environments,
    environmentsQuery,
    selectedConfig,
    selectedConfigId,
    selectedEnvironment,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
  };
}

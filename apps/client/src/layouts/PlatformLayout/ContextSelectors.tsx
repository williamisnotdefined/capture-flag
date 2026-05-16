import { useCreateConfig } from "@api/configs";
import { useCreateEnvironment } from "@api/environments";
import { useCreateOrganization } from "@api/organizations";
import { useCreateProject } from "@api/projects";
import { CreateConfigForm, type CreateConfigFormSubmitValues } from "@components/CreateConfigForm";
import { CreateResourceDialog } from "@components/CreateResourceDialog";
import { ResourceSwitcher } from "@components/ResourceSwitcher";
import {
  configSearchParam,
  configsPath,
  environmentSearchParam,
  environmentsPath,
  flagsPath,
  organizationPath,
  projectSearchParam,
  projectsPath,
  segmentsPath,
  setSearchValue,
  withSearch,
} from "@routing/routePaths";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageOrganizationMembers, canManageProjectResources } from "@src/permissions";
import { Building2, Folder, Server, Settings2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

type ContextSelectorsProps = {
  activeSection: ContextNavigationSection;
  collapsed: boolean;
  onNavigate?: () => void;
  scope: "project" | "workspace";
};

type ContextNavigationSection =
  | "audit"
  | "configs"
  | "environments"
  | "flags"
  | "organizations"
  | "projects"
  | "sdkKeys"
  | "segments";
type CreateTarget = "config" | "environment" | "organization" | "project";

export function ContextSelectors({
  activeSection,
  collapsed,
  onNavigate,
  scope,
}: ContextSelectorsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { configId: routeConfigId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const {
    configs,
    environments,
    organizationRole,
    organizations,
    projects,
    selectedConfigId,
    selectedEnvironmentId,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
  } = useProjectResourcesRouteContext();
  const canCreateProject = Boolean(
    selectedOrganizationId && canManageOrganizationMembers(organizationRole),
  );
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const canCreateProjectResource = Boolean(selectedProjectId && canManageProjectResourceActions);
  const createOrganizationMutation = useCreateOrganization({
    onSuccess: (organization) => {
      setCreateTarget(null);
      navigate(organizationPath(organization.id));
    },
  });
  const createProjectMutation = useCreateProject({
    organizationId: selectedOrganizationId,
    onSuccess: (project) => {
      setCreateTarget(null);
      if (project.organizationId === selectedOrganizationId) {
        navigate(projectsPath(selectedOrganizationId, project.id));
      }
    },
  });
  const createConfigMutation = useCreateConfig({
    projectId: selectedProjectId,
    onSuccess: (config) => {
      setCreateTarget(null);
      selectConfig(config.id);
    },
  });
  const createEnvironmentMutation = useCreateEnvironment({
    projectId: selectedProjectId,
    onSuccess: (environment) => {
      setCreateTarget(null);
      selectEnvironment(environment.id);
    },
  });
  const createDialogState = createTarget
    ? {
        copy: getCreateDialogCopy(createTarget),
        target: createTarget,
      }
    : null;

  function selectOrganization(organizationId: string) {
    navigate(organizationPath(organizationId));
  }

  function selectProject(projectId: string) {
    if (location.pathname.endsWith("/audit-logs")) {
      setSearchParams(setSearchValue(searchParams, projectSearchParam, projectId));
      return;
    }

    navigate(projectsPath(selectedOrganizationId, projectId));
  }

  function selectConfig(configId: string) {
    if (location.pathname.endsWith("/sdk-keys")) {
      setSearchParams(setSearchValue(searchParams, configSearchParam, configId));
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(configSearchParam);

    if (location.pathname.endsWith("/flags")) {
      navigate(
        withSearch(
          flagsPath(selectedOrganizationId, selectedProjectId, configId),
          nextSearchParams,
        ),
      );
      return;
    }

    if (location.pathname.endsWith("/segments")) {
      navigate(
        withSearch(
          segmentsPath(selectedOrganizationId, selectedProjectId, configId),
          nextSearchParams,
        ),
      );
      return;
    }

    navigate(
      withSearch(
        configsPath(selectedOrganizationId, selectedProjectId, configId),
        nextSearchParams,
      ),
    );
  }

  function selectEnvironment(environmentId: string) {
    setSearchParams(setSearchValue(searchParams, environmentSearchParam, environmentId));
  }

  async function createContextResource(name: string) {
    if (!createTarget) {
      return;
    }

    if (createTarget === "organization") {
      await createOrganizationMutation.mutateAsync(name);
      return;
    }

    if (createTarget === "project") {
      await createProjectMutation.mutateAsync(name);
      return;
    }

    if (createTarget === "config") {
      await createConfigMutation.mutateAsync({ name });
      return;
    }

    await createEnvironmentMutation.mutateAsync(name);
  }

  async function createContextConfig(values: CreateConfigFormSubmitValues) {
    await createConfigMutation.mutateAsync(values);
  }

  return (
    <>
      {scope === "workspace" ? (
        <>
          <ResourceSwitcher
            collapsed={collapsed}
            createDisabled={createOrganizationMutation.isPending}
            createLabel="Criar organizacao"
            disabled={organizations.length === 0 && createOrganizationMutation.isPending}
            icon={Building2}
            isActive={activeSection === "organizations"}
            label="Organizacao"
            onChange={selectOrganization}
            onCreate={() => setCreateTarget("organization")}
            onNavigate={onNavigate}
            options={organizations}
            path="/organizations"
            placeholder="Sem organizacoes"
            value={selectedOrganizationId}
          />
          <ResourceSwitcher
            collapsed={collapsed}
            createDisabled={!canCreateProject || createProjectMutation.isPending}
            createLabel="Criar projeto"
            disabled={!selectedOrganizationId || (projects.length === 0 && !canCreateProject)}
            icon={Folder}
            isActive={activeSection === "projects"}
            label="Projeto"
            onChange={selectProject}
            onCreate={() => setCreateTarget("project")}
            onNavigate={onNavigate}
            options={projects}
            path={projectsPath(selectedOrganizationId)}
            placeholder="Sem projetos"
            value={selectedProjectId}
          />
        </>
      ) : (
        <>
          <ResourceSwitcher
            collapsed={collapsed}
            createDisabled={!canCreateProjectResource || createConfigMutation.isPending}
            createLabel="Criar config"
            disabled={!selectedProjectId || (configs.length === 0 && !canCreateProjectResource)}
            icon={Settings2}
            isActive={activeSection === "configs"}
            label="Config"
            onChange={selectConfig}
            onCreate={() => setCreateTarget("config")}
            onNavigate={onNavigate}
            options={configs}
            path={configsPath(selectedOrganizationId, selectedProjectId)}
            placeholder="Sem configs"
            value={selectedConfigId || routeConfigId}
          />
          <ResourceSwitcher
            collapsed={collapsed}
            createDisabled={!canCreateProjectResource || createEnvironmentMutation.isPending}
            createLabel="Criar environment"
            disabled={
              !selectedProjectId || (environments.length === 0 && !canCreateProjectResource)
            }
            icon={Server}
            isActive={activeSection === "environments"}
            label="Environment"
            onChange={selectEnvironment}
            onCreate={() => setCreateTarget("environment")}
            onNavigate={onNavigate}
            options={environments}
            path={environmentsPath(selectedOrganizationId, selectedProjectId)}
            placeholder="Sem environments"
            value={selectedEnvironmentId}
          />
        </>
      )}
      {createDialogState ? (
        <CreateResourceDialog
          description={createDialogState.copy.description}
          disabled={getCreatePending(createDialogState.target, {
            config: createConfigMutation.isPending,
            environment: createEnvironmentMutation.isPending,
            organization: createOrganizationMutation.isPending,
            project: createProjectMutation.isPending,
          })}
          error={getCreateError(createDialogState.target, {
            config: createConfigMutation.error,
            environment: createEnvironmentMutation.error,
            organization: createOrganizationMutation.error,
            project: createProjectMutation.error,
          })}
          onOpenChange={(open) => {
            if (!open) {
              setCreateTarget(null);
            }
          }}
          onSubmit={createContextResource}
          open={Boolean(createTarget)}
          placeholder={createDialogState.copy.placeholder}
          title={createDialogState.copy.title}
        >
          {createDialogState.target === "config" ? (
            <CreateConfigForm
              disabled={createConfigMutation.isPending}
              dividedFooter
              onSubmit={createContextConfig}
            />
          ) : null}
        </CreateResourceDialog>
      ) : null}
    </>
  );
}

function getCreateDialogCopy(target: CreateTarget) {
  const copy = {
    config: {
      description: "Informe nome e descricao da config consumida pelos SDKs.",
      placeholder: "Nova config",
      title: "Nova config",
    },
    environment: {
      description: "Informe o nome do ambiente para publicar valores de runtime.",
      placeholder: "production",
      title: "Novo environment",
    },
    organization: {
      description: "Informe o nome da organizacao para criar um novo tenant.",
      placeholder: "Nome da organizacao",
      title: "Nova organizacao",
    },
    project: {
      description: "Informe o nome do projeto dentro da organizacao selecionada.",
      placeholder: "Novo projeto",
      title: "Novo projeto",
    },
  } satisfies Record<CreateTarget, { description: string; placeholder: string; title: string }>;

  return copy[target];
}

function getCreatePending(target: CreateTarget, pending: Record<CreateTarget, boolean>) {
  return pending[target];
}

function getCreateError(target: CreateTarget, errors: Record<CreateTarget, unknown>) {
  return errors[target];
}

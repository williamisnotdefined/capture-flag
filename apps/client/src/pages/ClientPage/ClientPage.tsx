import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGetMe, useLogout } from "../../api/auth";
import { apiBaseUrl } from "../../api/client";
import { useCreateConfig, useGetProjectConfigs } from "../../api/configs";
import { useCreateEnvironment, useGetProjectEnvironments } from "../../api/environments";
import {
  useAddOrganizationMember,
  useCreateOrganization,
  useGetOrganizationMembers,
} from "../../api/organizations";
import {
  useAddProjectMember,
  useCreateProject,
  useGetProjectMembers,
  useGetProjects,
} from "../../api/projects";
import { useCreateSdkKey, useGetProjectSdkKeys } from "../../api/sdkKeys";
import { FeatureFlagsPanel } from "../../components/FeatureFlagsPanel";
import { Shell } from "../../components/Shell";
import { MembersPanel } from "./MembersPanel";
import { OrganizationPanel } from "./OrganizationPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import { ResourcePanel } from "./ResourcePanel";
import { SdkKeysPanel } from "./SdkKeysPanel";
import { SessionHeader } from "./SessionHeader";
import type { CreatedSdkKeyState } from "./types";

const ownerOrganizationRoles = ["owner", "admin", "member", "viewer"];
const adminOrganizationRoles = ["admin", "member", "viewer"];
const projectRoles = ["project_admin", "developer", "viewer"];

export function ClientPage() {
  const navigate = useNavigate();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>("");
  const [pendingSelectedOrganizationId, setPendingSelectedOrganizationId] = useState<string>("");
  const [pendingSelectedProjectId, setPendingSelectedProjectId] = useState<string>("");
  const [createdSdkKey, setCreatedSdkKey] = useState<CreatedSdkKeyState | null>(null);
  const [copyMessage, setCopyMessage] = useState<string>("");
  const selectedOrganizationIdRef = useRef<string>("");

  const meQuery = useGetMe();
  const organizations = meQuery.data?.organizations ?? [];

  useEffect(() => {
    const selectedOrganizationExists = organizations.some(
      (organization) => organization.id === selectedOrganizationId,
    );

    if (
      pendingSelectedOrganizationId &&
      selectedOrganizationId === pendingSelectedOrganizationId &&
      !selectedOrganizationExists
    ) {
      return;
    }

    if (
      pendingSelectedOrganizationId &&
      (selectedOrganizationExists || selectedOrganizationId !== pendingSelectedOrganizationId)
    ) {
      setPendingSelectedOrganizationId("");
    }

    const nextOrganizationId = selectedOrganizationExists
      ? selectedOrganizationId
      : (organizations[0]?.id ?? "");

    if (selectedOrganizationId !== nextOrganizationId) {
      selectOrganizationId(nextOrganizationId);
      setPendingSelectedProjectId("");
      setSelectedProjectId("");
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      setCreatedSdkKey(null);
      setCopyMessage("");
    }
  }, [organizations, pendingSelectedOrganizationId, selectedOrganizationId]);

  const projectsQuery = useGetProjects(selectedOrganizationId);
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    const selectedProjectExists = projects.some((project) => project.id === selectedProjectId);

    if (
      pendingSelectedProjectId &&
      selectedProjectId === pendingSelectedProjectId &&
      !selectedProjectExists
    ) {
      return;
    }

    if (
      pendingSelectedProjectId &&
      (selectedProjectExists || selectedProjectId !== pendingSelectedProjectId)
    ) {
      setPendingSelectedProjectId("");
    }

    const nextProjectId = selectedProjectExists ? selectedProjectId : (projects[0]?.id ?? "");

    if (selectedProjectId !== nextProjectId) {
      setSelectedProjectId(nextProjectId);
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      setCreatedSdkKey(null);
      setCopyMessage("");
    }
  }, [pendingSelectedProjectId, projects, selectedProjectId]);

  const configsQuery = useGetProjectConfigs(selectedProjectId);
  const environmentsQuery = useGetProjectEnvironments(selectedProjectId);
  const sdkKeysQuery = useGetProjectSdkKeys(selectedProjectId);
  const organizationMembersQuery = useGetOrganizationMembers(selectedOrganizationId);
  const projectMembersQuery = useGetProjectMembers(selectedProjectId);

  const configs = configsQuery.data ?? [];
  const environments = environmentsQuery.data ?? [];
  const sdkKeys = sdkKeysQuery.data ?? [];
  const organizationMembers = organizationMembersQuery.data ?? [];
  const projectMembers = projectMembersQuery.data ?? [];

  useEffect(() => {
    const nextConfigId = configs.some((config) => config.id === selectedConfigId)
      ? selectedConfigId
      : (configs[0]?.id ?? "");

    if (selectedConfigId !== nextConfigId) {
      setSelectedConfigId(nextConfigId);
    }
  }, [configs, selectedConfigId]);

  useEffect(() => {
    const nextEnvironmentId = environments.some(
      (environment) => environment.id === selectedEnvironmentId,
    )
      ? selectedEnvironmentId
      : (environments[0]?.id ?? "");

    if (selectedEnvironmentId !== nextEnvironmentId) {
      setSelectedEnvironmentId(nextEnvironmentId);
    }
  }, [environments, selectedEnvironmentId]);

  const currentOrganization = organizations.find((org) => org.id === selectedOrganizationId);
  const currentProject = projects.find((project) => project.id === selectedProjectId);
  const selectedConfig = configs.find((config) => config.id === selectedConfigId);
  const selectedEnvironment = environments.find(
    (environment) => environment.id === selectedEnvironmentId,
  );
  const isOrganizationAdmin = ["owner", "admin"].includes(currentOrganization?.role ?? "");
  const canManageProjectResources =
    isOrganizationAdmin || currentProject?.currentUserProjectRole === "project_admin";
  const canManageFeatureFlags =
    canManageProjectResources || currentProject?.currentUserProjectRole === "developer";
  const organizationRoleOptions =
    currentOrganization?.role === "owner" ? ownerOrganizationRoles : adminOrganizationRoles;
  const canCreateSdkKey = Boolean(
    selectedProjectId &&
      selectedConfig?.projectId === selectedProjectId &&
      selectedEnvironment?.projectId === selectedProjectId &&
      canManageProjectResources,
  );
  const visibleCreatedSdkKey =
    createdSdkKey &&
    createdSdkKey.projectId === selectedProjectId &&
    createdSdkKey.configId === selectedConfigId &&
    createdSdkKey.environmentId === selectedEnvironmentId
      ? createdSdkKey
      : null;
  const visiblePublicConfigUrl = visibleCreatedSdkKey
    ? `${apiBaseUrl}/public/sdk/${encodeURIComponent(visibleCreatedSdkKey.key)}/config`
    : "";

  function clearCreatedSdkKey() {
    setCreatedSdkKey(null);
    setCopyMessage("");
  }

  function selectOrganizationId(organizationId: string) {
    selectedOrganizationIdRef.current = organizationId;
    setSelectedOrganizationId(organizationId);
  }

  const createOrganizationMutation = useCreateOrganization({
    onSuccess: (organization) => {
      setPendingSelectedOrganizationId(organization.id);
      selectOrganizationId(organization.id);
      setPendingSelectedProjectId("");
      setSelectedProjectId("");
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      clearCreatedSdkKey();
    },
  });

  const createProjectMutation = useCreateProject({
    organizationId: selectedOrganizationId,
    onSuccess: (project) => {
      if (project.organizationId !== selectedOrganizationIdRef.current) {
        return;
      }

      setPendingSelectedProjectId(project.id);
      setSelectedProjectId(project.id);
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      clearCreatedSdkKey();
    },
  });

  const createConfigMutation = useCreateConfig({
    projectId: selectedProjectId,
  });

  const createEnvironmentMutation = useCreateEnvironment({
    projectId: selectedProjectId,
  });

  const addOrganizationMemberMutation = useAddOrganizationMember(selectedOrganizationId);
  const addProjectMemberMutation = useAddProjectMember(selectedProjectId);

  const createSdkKeyMutation = useCreateSdkKey({
    projectId: selectedProjectId,
    onSuccess: (sdkKey) => {
      setCreatedSdkKey(
        sdkKey.key
          ? {
              configId: sdkKey.configId,
              environmentId: sdkKey.environmentId,
              key: sdkKey.key,
              projectId: sdkKey.projectId,
            }
          : null,
      );
      setCopyMessage("");
    },
  });

  const logoutMutation = useLogout({
    onSuccess: () => {
      selectOrganizationId("");
      setSelectedProjectId("");
      setSelectedConfigId("");
      setSelectedEnvironmentId("");
      clearCreatedSdkKey();
      navigate("/login");
    },
  });

  async function handleCreateSdkKey(values: { name: string }) {
    if (!selectedConfig || !selectedEnvironment) {
      return;
    }

    const name = values.name.trim();

    await createSdkKeyMutation.mutateAsync({
      configId: selectedConfig.id,
      environmentId: selectedEnvironment.id,
      ...(name ? { name } : {}),
    });
  }

  async function handleCopySdkKey() {
    if (!visibleCreatedSdkKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(visibleCreatedSdkKey.key);
      setCopyMessage("Chave copiada.");
    } catch {
      setCopyMessage("Nao foi possivel copiar automaticamente.");
    }
  }

  if (meQuery.isLoading) {
    return <Shell title="Capture Flag">Carregando sessao...</Shell>;
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  const me = meQuery.data;
  if (!me) {
    return <Shell title="Capture Flag">Sessao indisponivel.</Shell>;
  }

  return (
    <Shell title="Capture Flag">
      <SessionHeader
        isLogoutPending={logoutMutation.isPending}
        onLogout={() => logoutMutation.mutate()}
        user={me.user}
      />

      <main className="grid gap-4 lg:grid-cols-2">
        <OrganizationPanel
          createError={createOrganizationMutation.error}
          isCreating={createOrganizationMutation.isPending}
          onCreate={createOrganizationMutation.mutateAsync}
          onSelect={(organizationId) => {
            selectOrganizationId(organizationId);
            setSelectedProjectId("");
            setSelectedConfigId("");
            setSelectedEnvironmentId("");
            clearCreatedSdkKey();
          }}
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
        />

        <MembersPanel
          addError={addOrganizationMemberMutation.error}
          disabled={!selectedOrganizationId || !isOrganizationAdmin}
          emptyMessage="Sem membros"
          isPending={addOrganizationMemberMutation.isPending}
          members={organizationMembers}
          onSubmit={addOrganizationMemberMutation.mutateAsync}
          permissionHint={
            !isOrganizationAdmin ? "Somente owner ou admin pode adicionar membros." : undefined
          }
          queryError={organizationMembersQuery.error}
          roles={organizationRoleOptions}
          title="Membros da organizacao"
        />

        <ProjectsPanel
          createDisabled={
            !selectedOrganizationId || !isOrganizationAdmin || createProjectMutation.isPending
          }
          createError={createProjectMutation.error}
          isFetching={projectsQuery.isFetching}
          onCreate={createProjectMutation.mutateAsync}
          onSelect={(projectId) => {
            setSelectedProjectId(projectId);
            setSelectedConfigId("");
            setSelectedEnvironmentId("");
            clearCreatedSdkKey();
          }}
          permissionHint={
            !isOrganizationAdmin ? "Somente owner ou admin pode criar projetos." : undefined
          }
          projects={projects}
          queryError={projectsQuery.error}
          selectedProjectId={selectedProjectId}
        />

        <MembersPanel
          addError={addProjectMemberMutation.error}
          disabled={!selectedProjectId || !isOrganizationAdmin}
          emptyMessage="Sem membros no projeto"
          isPending={addProjectMemberMutation.isPending}
          members={projectMembers}
          onSubmit={addProjectMemberMutation.mutateAsync}
          permissionHint={
            !isOrganizationAdmin
              ? "Somente owner ou admin pode conceder roles por projeto."
              : undefined
          }
          queryError={projectMembersQuery.error}
          roles={projectRoles}
          title="Membros do projeto"
        />

        <ResourcePanel
          createDisabled={
            !selectedProjectId || !canManageProjectResources || createConfigMutation.isPending
          }
          createError={createConfigMutation.error}
          createPlaceholder="Nova config"
          emptyMessage="Sem configs"
          items={configs}
          listItems={configs.map((config) => `${config.name} (${config.key})`)}
          onCreate={createConfigMutation.mutateAsync}
          onSelect={(configId) => {
            setSelectedConfigId(configId);
            clearCreatedSdkKey();
          }}
          permissionHint={
            !canManageProjectResources
              ? "Voce nao tem permissao para criar configs neste projeto."
              : undefined
          }
          queryError={configsQuery.error}
          renderOption={(config) => `${config.name} (${config.key})`}
          selectedId={selectedConfigId}
          selectDisabled={configs.length === 0}
          selectPlaceholder="Selecione uma config"
          title="Configs"
        />

        <ResourcePanel
          createDisabled={
            !selectedProjectId || !canManageProjectResources || createEnvironmentMutation.isPending
          }
          createError={createEnvironmentMutation.error}
          createPlaceholder="production"
          emptyMessage="Sem ambientes"
          items={environments}
          listItems={environments.map((environment) => `${environment.name} (${environment.key})`)}
          onCreate={createEnvironmentMutation.mutateAsync}
          onSelect={(environmentId) => {
            setSelectedEnvironmentId(environmentId);
            clearCreatedSdkKey();
          }}
          permissionHint={
            !canManageProjectResources
              ? "Voce nao tem permissao para criar ambientes neste projeto."
              : undefined
          }
          queryError={environmentsQuery.error}
          renderOption={(environment) => `${environment.name} (${environment.key})`}
          selectedId={selectedEnvironmentId}
          selectDisabled={environments.length === 0}
          selectPlaceholder="Selecione um ambiente"
          title="Ambientes"
        />

        <FeatureFlagsPanel
          canManageFeatureFlags={canManageFeatureFlags}
          configId={selectedConfigId}
          environmentId={selectedEnvironmentId}
          environmentName={selectedEnvironment?.name}
        />

        <SdkKeysPanel
          canCreateSdkKey={canCreateSdkKey}
          canManageProjectResources={canManageProjectResources}
          copyMessage={copyMessage}
          createError={createSdkKeyMutation.error}
          createdSdkKey={visibleCreatedSdkKey}
          isCreating={createSdkKeyMutation.isPending}
          isFetching={sdkKeysQuery.isFetching}
          onCopySdkKey={handleCopySdkKey}
          onCreateSdkKey={handleCreateSdkKey}
          publicConfigUrl={visiblePublicConfigUrl}
          queryError={sdkKeysQuery.error}
          sdkKeys={sdkKeys}
        />
      </main>
    </Shell>
  );
}

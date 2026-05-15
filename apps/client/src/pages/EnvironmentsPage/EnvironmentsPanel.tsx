import { useCreateEnvironment } from "../../api/environments";
import { ResourcePanel } from "../../components";
import { canManageProjectResources } from "../../permissions";
import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";

export function EnvironmentsPanel() {
  const {
    environments,
    environmentsQuery,
    organizationRole,
    selectedEnvironmentId,
    selectedProject,
    selectedProjectId,
    setSelectedEnvironmentId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const createEnvironmentMutation = useCreateEnvironment({ projectId: selectedProjectId });

  return (
    <ResourcePanel
      create={{
        disabled:
          !selectedProjectId ||
          !canManageProjectResourceActions ||
          createEnvironmentMutation.isPending,
        error: createEnvironmentMutation.error,
        onSubmit: createEnvironmentMutation.mutateAsync,
        placeholder: "production",
      }}
      emptyMessage="Sem ambientes"
      items={environments}
      onSelect={setSelectedEnvironmentId}
      permissionHint={
        !canManageProjectResourceActions
          ? "Voce nao tem permissao para criar ambientes neste projeto."
          : undefined
      }
      queryError={environmentsQuery.error}
      selectedId={selectedEnvironmentId}
      selectPlaceholder="Selecione um ambiente"
      title="Ambientes"
    />
  );
}

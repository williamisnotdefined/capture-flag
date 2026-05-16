import { useUpdateEnvironment } from "../../api/environments";
import { ResourcePanel } from "../../components";
import { canManageProjectResources } from "../../permissions";
import { useProjectResourcesRouteContext } from "../../routing/useRouteContext";

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
  const updateEnvironmentMutation = useUpdateEnvironment({ projectId: selectedProjectId });

  return (
    <ResourcePanel
      canEditName={canManageProjectResourceActions}
      emptyMessage="Sem ambientes"
      items={environments}
      mutationError={updateEnvironmentMutation.error}
      nameEditDisabled={updateEnvironmentMutation.isPending}
      onRename={(environment, name) =>
        updateEnvironmentMutation.mutateAsync({ environmentId: environment.id, name })
      }
      onSelect={setSelectedEnvironmentId}
      permissionHint={
        !canManageProjectResourceActions
          ? "Voce nao tem permissao para criar ou editar ambientes neste projeto."
          : undefined
      }
      queryError={environmentsQuery.error}
      selectedId={selectedEnvironmentId}
      title="Ambientes"
    />
  );
}

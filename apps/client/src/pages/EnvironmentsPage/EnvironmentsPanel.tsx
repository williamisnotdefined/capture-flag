import { ResourcePanel } from "../../components";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageProjectResources } from "../../permissions";

export function EnvironmentsPanel() {
  const {
    environments,
    environmentsQuery,
    organizationRole,
    selectedEnvironmentId,
    selectedProject,
    setSelectedEnvironmentId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <ResourcePanel
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
      title="Ambientes"
    />
  );
}

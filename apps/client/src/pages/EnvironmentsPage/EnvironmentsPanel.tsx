import { useDeleteEnvironment, useUpdateEnvironment } from "@api/environments";
import { ResourcePanel } from "@components/ResourcePanel";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageProjectResources } from "@src/permissions";
import type { Environment } from "@src/types";

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
  const deleteEnvironmentMutation = useDeleteEnvironment({
    projectId: selectedProjectId,
    onSuccess: (deletedEnvironmentId) => {
      if (deletedEnvironmentId === selectedEnvironmentId) {
        setSelectedEnvironmentId("");
      }
    },
  });

  function canDeleteEnvironment() {
    return canManageProjectResourceActions;
  }

  function deleteEnvironment(environment: Environment) {
    if (!canDeleteEnvironment()) {
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir o environment "${environment.name}"? Ele deixara de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    deleteEnvironmentMutation.mutate(environment.id);
  }

  function deleteEnvironments(selectedEnvironments: Environment[]) {
    const deletableEnvironments = selectedEnvironments.filter(canDeleteEnvironment);
    if (deletableEnvironments.length === 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir ${formatEnvironmentSelectionLabel(deletableEnvironments.length)}? Eles deixarao de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    for (const environment of deletableEnvironments) {
      deleteEnvironmentMutation.mutate(environment.id);
    }
  }

  return (
    <ResourcePanel
      canEditName={canManageProjectResourceActions}
      canDeleteItem={canDeleteEnvironment}
      deleteDisabled={deleteEnvironmentMutation.isPending}
      deleteLabel="Excluir"
      emptyMessage="Sem ambientes"
      items={environments}
      mutationError={updateEnvironmentMutation.error ?? deleteEnvironmentMutation.error}
      nameEditDisabled={updateEnvironmentMutation.isPending}
      onBulkDelete={deleteEnvironments}
      onDelete={deleteEnvironment}
      onRename={(environment, name) =>
        updateEnvironmentMutation.mutateAsync({ environmentId: environment.id, name })
      }
      onSelect={setSelectedEnvironmentId}
      permissionHint={
        !canManageProjectResourceActions
          ? "Voce nao tem permissao para criar, editar ou excluir environments neste projeto."
          : undefined
      }
      queryError={environmentsQuery.error}
      selectionLabel={formatEnvironmentSelectionLabel}
      selectedId={selectedEnvironmentId}
      title="Ambientes"
    />
  );
}

function formatEnvironmentSelectionLabel(selectedCount: number) {
  return selectedCount === 1
    ? "1 environment selecionado"
    : `${selectedCount} environments selecionados`;
}

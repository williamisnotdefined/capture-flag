import { useNavigate } from "react-router-dom";
import { useCreateConfig } from "../../api/configs";
import { ResourcePanel } from "../../components";
import { canManageProjectResources } from "../../permissions";
import { configsPath } from "../PlatformLayout/routePaths";
import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";

export function ConfigsPanel() {
  const navigate = useNavigate();
  const {
    configs,
    configsQuery,
    organizationRole,
    selectedConfigId,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );
  const createConfigMutation = useCreateConfig({ projectId: selectedProjectId });

  return (
    <ResourcePanel
      create={{
        disabled:
          !selectedProjectId || !canManageProjectResourceActions || createConfigMutation.isPending,
        error: createConfigMutation.error,
        onSubmit: createConfigMutation.mutateAsync,
        placeholder: "Nova config",
      }}
      emptyMessage="Sem configs"
      items={configs}
      onSelect={(configId) =>
        navigate(configsPath(selectedOrganizationId, selectedProjectId, configId))
      }
      permissionHint={
        !canManageProjectResourceActions
          ? "Voce nao tem permissao para criar configs neste projeto."
          : undefined
      }
      queryError={configsQuery.error}
      selectedId={selectedConfigId}
      selectPlaceholder="Selecione uma config"
      title="Configs"
    />
  );
}

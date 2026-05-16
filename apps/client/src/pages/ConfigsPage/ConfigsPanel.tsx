import { useNavigate } from "react-router-dom";
import { ResourcePanel } from "../../components";
import { configsPath } from "../../layouts/PlatformLayout/routePaths";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageProjectResources } from "../../permissions";

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

  return (
    <ResourcePanel
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
      title="Configs"
    />
  );
}

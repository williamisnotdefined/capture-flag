import { useNavigate } from "react-router-dom";
import { configsPath } from "../PlatformLayout/routePaths";
import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageProjectResources } from "../_shared/permissions";
import { ConfigPreviewPanel } from "./ConfigPreviewPanel";
import { ConfigsPanel } from "./ConfigsPanel";

export function ConfigsPage() {
  const navigate = useNavigate();
  const {
    configs,
    configsQuery,
    organizationRole,
    selectedConfig,
    selectedConfigId,
    selectedEnvironment,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <>
      <PageHeader
        description="Configs agrupam flags e segmentos que serao consumidos pelo SDK como JSON publico versionado."
        eyebrow="Projeto selecionado"
        title="Configs"
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ConfigsPanel
          canManageProjectResources={canManageProjectResourceActions}
          configs={configs}
          onSelect={(configId) =>
            navigate(configsPath(selectedOrganizationId, selectedProjectId, configId))
          }
          queryError={configsQuery.error}
          selectedConfigId={selectedConfigId}
          selectedProjectId={selectedProjectId}
        />
        <ConfigPreviewPanel
          selectedConfig={selectedConfig}
          selectedEnvironment={selectedEnvironment}
        />
      </div>
    </>
  );
}

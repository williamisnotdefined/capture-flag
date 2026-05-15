import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageProjectResources } from "../_shared/permissions";
import { SdkKeysSection } from "./SdkKeysSection";

export function SdkKeysPage() {
  const {
    organizationRole,
    selectedConfig,
    selectedEnvironment,
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
        description="Gere, revogue e rotacione SDK keys para o par config/environment selecionado no topo da tela."
        eyebrow="Public SDK"
        title="SDK Keys"
      />
      <SdkKeysSection
        canManageProjectResources={canManageProjectResourceActions}
        key={`${selectedProjectId}:${selectedConfig?.id ?? ""}:${selectedEnvironment?.id ?? ""}`}
        selectedConfig={selectedConfig}
        selectedEnvironment={selectedEnvironment}
        selectedProjectId={selectedProjectId}
      />
    </>
  );
}

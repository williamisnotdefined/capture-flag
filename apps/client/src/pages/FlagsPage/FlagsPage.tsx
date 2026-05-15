import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageFeatureFlags } from "../_shared/permissions";
import { FeatureFlagsPanel } from "./featureFlags/FeatureFlagsPanel";

export function FlagsPage() {
  const {
    environments,
    organizationRole,
    selectedConfig,
    selectedConfigId,
    selectedEnvironment,
    selectedEnvironmentId,
    selectedProject,
    setSelectedEnvironmentId,
  } = useProjectResourcesRouteContext();
  const canManageFeatureFlagActions = canManageFeatureFlags(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <>
      <PageHeader
        description="Crie, filtre e edite flags por config. O environment selecionado controla o valor publicado que esta em edicao."
        eyebrow={selectedConfig ? selectedConfig.name : "Config selecionada"}
        title="Flags"
      />
      <FeatureFlagsPanel
        canManageFeatureFlags={canManageFeatureFlagActions}
        configId={selectedConfigId}
        environmentId={selectedEnvironmentId}
        environmentName={selectedEnvironment?.name}
        environments={environments}
        onSelectEnvironment={setSelectedEnvironmentId}
      />
    </>
  );
}

import { PageLayout } from "../../components";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { FeatureFlagsPanel } from "./featureFlags/FeatureFlagsPanel";

export function FlagsPage() {
  const { selectedConfig } = useProjectResourcesRouteContext();

  return (
    <PageLayout
      description="Crie, filtre e edite flags por config. O environment selecionado controla o valor publicado que esta em edicao."
      eyebrow={selectedConfig ? selectedConfig.name : "Config selecionada"}
      title="Flags"
    >
      <FeatureFlagsPanel />
    </PageLayout>
  );
}

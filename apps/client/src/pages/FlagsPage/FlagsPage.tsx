import { Plus } from "lucide-react";
import { useState } from "react";
import { Button, PageLayout } from "../../components";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageFeatureFlags } from "../../permissions";
import { FeatureFlagsPanel } from "./featureFlags/FeatureFlagsPanel";

export function FlagsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { organizationRole, selectedConfig, selectedConfigId, selectedProject } =
    useProjectResourcesRouteContext();
  const canCreateFlag = Boolean(
    selectedConfigId &&
      canManageFeatureFlags(organizationRole, selectedProject?.currentUserProjectRole ?? null),
  );

  return (
    <PageLayout
      actions={
        <Button disabled={!canCreateFlag} onClick={() => setIsCreateOpen(true)} type="button">
          <span>Criar flag</span>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      }
      description="Crie, filtre e edite flags por config. O environment selecionado controla o valor publicado que esta em edicao."
      eyebrow={selectedConfig ? selectedConfig.name : "Config selecionada"}
      title="Flags"
    >
      <FeatureFlagsPanel isCreateOpen={isCreateOpen} onCreateOpenChange={setIsCreateOpen} />
    </PageLayout>
  );
}

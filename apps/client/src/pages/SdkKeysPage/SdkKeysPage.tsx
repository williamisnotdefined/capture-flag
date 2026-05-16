import { Button } from "@components/Button";
import { PageLayout } from "@components/PageLayout";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageProjectResources } from "@src/permissions";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SdkKeysSection } from "./SdkKeysSection";

export function SdkKeysPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const {
    organizationRole,
    selectedConfig,
    selectedEnvironment,
    selectedProject,
    selectedProjectId,
  } = useProjectResourcesRouteContext();
  const canCreateSdkKey = Boolean(
    selectedProjectId &&
      selectedConfig?.projectId === selectedProjectId &&
      selectedEnvironment?.projectId === selectedProjectId &&
      canManageProjectResources(organizationRole, selectedProject?.currentUserProjectRole ?? null),
  );

  return (
    <PageLayout
      actions={
        <Button disabled={!canCreateSdkKey} onClick={() => setIsCreateOpen(true)} type="button">
          <span>Gerar key</span>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      }
      description="Gere, revogue e rotacione SDK keys para o par config/environment selecionado no topo da tela."
      eyebrow="Public SDK"
      title="SDK Keys"
    >
      <SdkKeysSection isCreateOpen={isCreateOpen} onCreateOpenChange={setIsCreateOpen} />
    </PageLayout>
  );
}

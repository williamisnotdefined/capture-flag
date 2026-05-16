import { Button } from "@components/Button";
import { PageLayout } from "@components/PageLayout";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";
import { canManageSegments } from "@src/permissions";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SegmentsPanel } from "./segments/SegmentsPanel";

export function SegmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { organizationRole, selectedConfig, selectedConfigId, selectedProject } =
    useProjectResourcesRouteContext();
  const canCreateSegment = Boolean(
    selectedConfigId &&
      canManageSegments(organizationRole, selectedProject?.currentUserProjectRole ?? null),
  );

  return (
    <PageLayout
      actions={
        <Button disabled={!canCreateSegment} onClick={() => setIsCreateOpen(true)} type="button">
          <span>Criar segment</span>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      }
      description="Segments sao grupos reutilizaveis de targeting usados pelas regras de flags dentro da config."
      eyebrow={selectedConfig ? selectedConfig.name : "Config selecionada"}
      title="Segments"
    >
      <SegmentsPanel isCreateOpen={isCreateOpen} onCreateOpenChange={setIsCreateOpen} />
    </PageLayout>
  );
}

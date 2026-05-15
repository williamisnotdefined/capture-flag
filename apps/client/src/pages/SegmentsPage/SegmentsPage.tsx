import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageSegments } from "../_shared/permissions";
import { SegmentsPanel } from "./segments/SegmentsPanel";

export function SegmentsPage() {
  const { organizationRole, selectedConfig, selectedConfigId, selectedProject } =
    useProjectResourcesRouteContext();
  const canManageSegmentActions = canManageSegments(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <>
      <PageHeader
        description="Segments sao grupos reutilizaveis de targeting usados pelas regras de flags dentro da config."
        eyebrow={selectedConfig ? selectedConfig.name : "Config selecionada"}
        title="Segments"
      />
      <SegmentsPanel canManageSegments={canManageSegmentActions} configId={selectedConfigId} />
    </>
  );
}

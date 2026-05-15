import { PageLayout } from "../../components";
import { useProjectResourcesRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { SegmentsPanel } from "./segments/SegmentsPanel";

export function SegmentsPage() {
  const { selectedConfig } = useProjectResourcesRouteContext();

  return (
    <PageLayout
      description="Segments sao grupos reutilizaveis de targeting usados pelas regras de flags dentro da config."
      eyebrow={selectedConfig ? selectedConfig.name : "Config selecionada"}
      title="Segments"
    >
      <SegmentsPanel />
    </PageLayout>
  );
}

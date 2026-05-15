import { PageLayout } from "../../components";
import { ConfigPreviewPanel } from "./ConfigPreviewPanel";
import { ConfigsPanel } from "./ConfigsPanel";

export function ConfigsPage() {
  return (
    <PageLayout
      contentClassName="grid gap-4 xl:grid-cols-2"
      description="Configs agrupam flags e segmentos que serao consumidos pelo SDK como JSON publico versionado."
      eyebrow="Projeto selecionado"
      title="Configs"
    >
      <ConfigsPanel />
      <ConfigPreviewPanel />
    </PageLayout>
  );
}

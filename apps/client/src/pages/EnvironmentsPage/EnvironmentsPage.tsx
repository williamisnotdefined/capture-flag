import { PageLayout } from "../../components";
import { EnvironmentsPanel } from "./EnvironmentsPanel";

export function EnvironmentsPage() {
  return (
    <PageLayout
      contentClassName="grid gap-4 xl:grid-cols-2"
      description="Ambientes representam os runtimes onde valores de flags, SDK keys e previews sao publicados."
      eyebrow="Projeto selecionado"
      title="Environments"
    >
      <EnvironmentsPanel />
    </PageLayout>
  );
}

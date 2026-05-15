import { PageLayout } from "../../components";
import { ProjectMembersSection } from "./ProjectMembersSection";
import { ProjectsPanel } from "./ProjectsPanel";

export function ProjectsPage() {
  return (
    <PageLayout
      contentClassName="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      description="Projetos agrupam configs, ambientes, flags, segmentos, SDK keys e membros com roles proprias."
      eyebrow="Organizacao selecionada"
      title="Projetos"
    >
      <ProjectsPanel />
      <ProjectMembersSection />
    </PageLayout>
  );
}

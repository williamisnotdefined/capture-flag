import { PageLayout } from "@components/PageLayout";
import { useProjectRouteContext } from "@routing/useRouteContext";
import { useParams } from "react-router-dom";
import { ProjectMembersSection } from "./ProjectMembersSection";
import { ProjectPanel, ProjectsPanel } from "./ProjectsPanel";

export function ProjectsPage() {
  const { projectId = "" } = useParams();
  const { selectedProject } = useProjectRouteContext();

  if (projectId) {
    return (
      <div className="flex flex-1 flex-col gap-4 sm:gap-6">
        <ProjectPanel />
        {selectedProject ? <ProjectMembersSection /> : null}
      </div>
    );
  }

  return (
    <PageLayout
      description="Projetos agrupam configs, ambientes, flags, segmentos, SDK keys e membros com roles proprias."
      eyebrow="Organizacao selecionada"
      title="Projetos"
    >
      <ProjectsPanel />
    </PageLayout>
  );
}

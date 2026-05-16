import { useParams } from "react-router-dom";
import { PageLayout } from "../../components";
import { useProjectRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { ProjectMembersSection } from "./ProjectMembersSection";
import { ProjectPanel, ProjectsPanel } from "./ProjectsPanel";

export function ProjectsPage() {
  const { projectId = "" } = useParams();
  const { selectedProject } = useProjectRouteContext();

  if (projectId) {
    return (
      <PageLayout
        contentClassName="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        description="Edite dados do projeto, navegue pelos recursos e gerencie membros do escopo."
        eyebrow="Projeto selecionado"
        title={selectedProject ? selectedProject.name : "Projeto"}
      >
        <ProjectPanel />
        {selectedProject ? <ProjectMembersSection /> : null}
      </PageLayout>
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

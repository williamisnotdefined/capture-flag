import { useNavigate } from "react-router-dom";
import { projectsPath } from "../PlatformLayout/routePaths";
import { useProjectRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageOrganizationMembers, canManageProjectResources } from "../_shared/permissions";
import { ProjectMembersSection } from "./ProjectMembersSection";
import { ProjectsPanel } from "./ProjectsPanel";

export function ProjectsPage() {
  const navigate = useNavigate();
  const {
    organizationRole,
    projects,
    projectsQuery,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
  } = useProjectRouteContext();
  const isOrganizationAdmin = canManageOrganizationMembers(organizationRole);
  const canManageProjectMembers = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <>
      <PageHeader
        description="Projetos agrupam configs, ambientes, flags, segmentos, SDK keys e membros com roles proprias."
        eyebrow="Organizacao selecionada"
        title="Projetos"
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ProjectsPanel
          isFetching={projectsQuery.isFetching}
          isOrganizationAdmin={isOrganizationAdmin}
          onCreated={(project) => {
            if (project.organizationId === selectedOrganizationId) {
              navigate(projectsPath(selectedOrganizationId, project.id));
            }
          }}
          onSelect={(projectId) => navigate(projectsPath(selectedOrganizationId, projectId))}
          organizationId={selectedOrganizationId}
          projects={projects}
          queryError={projectsQuery.error}
          selectedProjectId={selectedProjectId}
        />
        <ProjectMembersSection
          canManageProjectMembers={canManageProjectMembers}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </>
  );
}

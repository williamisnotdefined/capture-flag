import { useGetProjects } from "../../../api/projects";
import { ProjectResourcesWorkspace } from "../projectResources/ProjectResourcesWorkspace";
import { ProjectMembersSection } from "./ProjectMembersSection";
import { ProjectsPanel } from "./ProjectsPanel";
import { useProjectSelection } from "./useProjectSelection";

type ProjectWorkspaceProps = {
  isOrganizationAdmin: boolean;
  selectedOrganizationId: string;
};

export function ProjectWorkspace({
  isOrganizationAdmin,
  selectedOrganizationId,
}: ProjectWorkspaceProps) {
  const projectsQuery = useGetProjects(selectedOrganizationId);
  const projects = projectsQuery.data ?? [];
  const { currentProject, selectCreatedProject, selectProjectId, selectedProjectId } =
    useProjectSelection(projects);
  const canManageProjectResources =
    isOrganizationAdmin || currentProject?.currentUserProjectRole === "project_admin";
  const canManageFeatureFlags =
    canManageProjectResources || currentProject?.currentUserProjectRole === "developer";

  return (
    <>
      <ProjectsPanel
        isFetching={projectsQuery.isFetching}
        isOrganizationAdmin={isOrganizationAdmin}
        onCreated={(project) => {
          if (project.organizationId === selectedOrganizationId) {
            selectCreatedProject(project);
          }
        }}
        onSelect={selectProjectId}
        organizationId={selectedOrganizationId}
        projects={projects}
        queryError={projectsQuery.error}
        selectedProjectId={selectedProjectId}
      />

      <ProjectMembersSection
        isOrganizationAdmin={isOrganizationAdmin}
        selectedProjectId={selectedProjectId}
      />

      <ProjectResourcesWorkspace
        canManageFeatureFlags={canManageFeatureFlags}
        canManageProjectResources={canManageProjectResources}
        selectedProjectId={selectedProjectId}
      />
    </>
  );
}

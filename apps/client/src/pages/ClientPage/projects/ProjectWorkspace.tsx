import { useGetProjects } from "../../../api/projects";
import type { OrganizationRole } from "../../../types";
import { AuditLogsPanel } from "../audit/AuditLogsPanel";
import {
  canManageFeatureFlags,
  canManageOrganizationMembers,
  canManageProjectResources,
  canManageSegments,
} from "../permissions";
import { ProjectResourcesWorkspace } from "../projectResources/ProjectResourcesWorkspace";
import { ProjectMembersSection } from "./ProjectMembersSection";
import { ProjectsPanel } from "./ProjectsPanel";
import { useProjectSelection } from "./useProjectSelection";

type ProjectWorkspaceProps = {
  organizationRole: OrganizationRole | null;
  selectedOrganizationId: string;
};

export function ProjectWorkspace({
  organizationRole,
  selectedOrganizationId,
}: ProjectWorkspaceProps) {
  const projectsQuery = useGetProjects(selectedOrganizationId);
  const projects = projectsQuery.data ?? [];
  const { currentProject, selectCreatedProject, selectProjectId, selectedProjectId } =
    useProjectSelection(projects);
  const isOrganizationAdmin = canManageOrganizationMembers(organizationRole);
  const projectRole = currentProject?.currentUserProjectRole ?? null;
  const canManageProjectResourceActions = canManageProjectResources(organizationRole, projectRole);
  const canManageFeatureFlagActions = canManageFeatureFlags(organizationRole, projectRole);
  const canManageSegmentActions = canManageSegments(organizationRole, projectRole);

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
        canManageProjectMembers={canManageProjectResourceActions}
        selectedProjectId={selectedProjectId}
      />

      <ProjectResourcesWorkspace
        canManageFeatureFlags={canManageFeatureFlagActions}
        canManageProjectResources={canManageProjectResourceActions}
        canManageSegments={canManageSegmentActions}
        selectedProjectId={selectedProjectId}
      />

      <AuditLogsPanel
        canViewOrganizationAudit={isOrganizationAdmin}
        organizationId={selectedOrganizationId}
        projectId={selectedProjectId}
      />
    </>
  );
}

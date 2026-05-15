import { useNavigate } from "react-router-dom";
import { useCreateProject } from "../../api/projects";
import { CreateNameForm, ErrorMessage, Panel, PermissionHint, SelectInput } from "../../components";
import { canManageOrganizationMembers } from "../../permissions";
import { projectsPath } from "../PlatformLayout/routePaths";
import { useProjectRouteContext } from "../PlatformLayout/useRouteContext";

export function ProjectsPanel() {
  const navigate = useNavigate();
  const { organizationRole, projects, projectsQuery, selectedOrganizationId, selectedProjectId } =
    useProjectRouteContext();
  const isOrganizationAdmin = canManageOrganizationMembers(organizationRole);
  const createProjectMutation = useCreateProject({
    organizationId: selectedOrganizationId,
    onSuccess: (project) => {
      if (project.organizationId === selectedOrganizationId) {
        navigate(projectsPath(selectedOrganizationId, project.id));
      }
    },
  });
  const createDisabled =
    !selectedOrganizationId || !isOrganizationAdmin || createProjectMutation.isPending;
  const permissionHint = !isOrganizationAdmin
    ? "Somente owner ou admin pode criar projetos."
    : undefined;

  return (
    <Panel title="Projetos">
      <CreateNameForm
        disabled={createDisabled}
        onSubmit={createProjectMutation.mutateAsync}
        placeholder="Novo projeto"
      />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={projectsQuery.error} />
      <ErrorMessage error={createProjectMutation.error} />
      <SelectInput
        className="mt-3 w-full"
        onChange={(event) => navigate(projectsPath(selectedOrganizationId, event.target.value))}
        value={selectedProjectId}
      >
        <option value="">Selecione</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </SelectInput>
      {projectsQuery.isFetching ? (
        <p className="mt-4 text-sm text-stone-600">Atualizando projetos...</p>
      ) : null}
    </Panel>
  );
}

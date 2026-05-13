import { useCreateProject } from "../../../api/projects";
import { CreateNameForm } from "../../../components/CreateNameForm";
import { Panel } from "../../../components/Panel";
import { ErrorMessage, PermissionHint, SelectInput } from "../../../components/ui";
import type { Project } from "../../../types";

type ProjectsPanelProps = {
  isOrganizationAdmin: boolean;
  isFetching: boolean;
  onCreated: (project: Project) => void;
  onSelect: (projectId: string) => void;
  organizationId: string;
  projects: Project[];
  queryError: unknown;
  selectedProjectId: string;
};

export function ProjectsPanel({
  isOrganizationAdmin,
  isFetching,
  onCreated,
  onSelect,
  organizationId,
  projects,
  queryError,
  selectedProjectId,
}: ProjectsPanelProps) {
  const createProjectMutation = useCreateProject({ organizationId, onSuccess: onCreated });
  const createDisabled = !organizationId || !isOrganizationAdmin || createProjectMutation.isPending;
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
      <ErrorMessage error={queryError} />
      <ErrorMessage error={createProjectMutation.error} />
      <SelectInput
        className="mt-3 w-full"
        onChange={(event) => onSelect(event.target.value)}
        value={selectedProjectId}
      >
        <option value="">Selecione</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </SelectInput>
      {isFetching ? <p className="mt-4 text-sm text-stone-600">Atualizando projetos...</p> : null}
    </Panel>
  );
}

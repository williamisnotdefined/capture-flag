import { CreateNameForm } from "../../components/CreateNameForm";
import { Panel } from "../../components/Panel";
import { ErrorMessage, PermissionHint, SelectInput } from "../../components/ui";
import type { Project } from "../../types";

type ProjectsPanelProps = {
  createDisabled: boolean;
  createError: unknown;
  isFetching: boolean;
  onCreate: (name: string) => Promise<unknown>;
  onSelect: (projectId: string) => void;
  permissionHint?: string;
  projects: Project[];
  queryError: unknown;
  selectedProjectId: string;
};

export function ProjectsPanel({
  createDisabled,
  createError,
  isFetching,
  onCreate,
  onSelect,
  permissionHint,
  projects,
  queryError,
  selectedProjectId,
}: ProjectsPanelProps) {
  return (
    <Panel title="Projetos">
      <CreateNameForm disabled={createDisabled} onSubmit={onCreate} placeholder="Novo projeto" />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={queryError} />
      <ErrorMessage error={createError} />
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

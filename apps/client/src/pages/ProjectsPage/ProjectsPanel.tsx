import { Link, useNavigate } from "react-router-dom";
import { useCreateProject, useDeleteProject, useUpdateProject } from "../../api/projects";
import {
  Button,
  CreateNameForm,
  ErrorMessage,
  Panel,
  PermissionHint,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components";
import { UpdateNameForm } from "../../components/UpdateNameForm";
import {
  configsPath,
  environmentsPath,
  projectsPath,
} from "../../layouts/PlatformLayout/routePaths";
import { useProjectRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageOrganizationMembers, canManageProjectResources } from "../../permissions";

export function ProjectsPanel() {
  const navigate = useNavigate();
  const { organizationRole, projects, projectsQuery, selectedOrganizationId } =
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
      <ProjectList projects={projects} selectedOrganizationId={selectedOrganizationId} />
      {projectsQuery.isFetching ? (
        <p className="mt-4 text-sm text-stone-600">Atualizando projetos...</p>
      ) : null}
    </Panel>
  );
}

export function ProjectPanel() {
  const navigate = useNavigate();
  const { organizationRole, selectedOrganizationId, selectedProject } = useProjectRouteContext();
  const updateProjectMutation = useUpdateProject({ organizationId: selectedOrganizationId });
  const deleteProjectMutation = useDeleteProject({
    organizationId: selectedOrganizationId,
    onSuccess: () => navigate(projectsPath(selectedOrganizationId)),
  });
  const canManageSelectedProject = Boolean(
    selectedProject &&
      canManageProjectResources(organizationRole, selectedProject.currentUserProjectRole ?? null),
  );

  function deleteSelectedProject() {
    if (!selectedProject || !canManageSelectedProject) {
      return;
    }

    const shouldDelete = window.confirm(
      `Arquivar o projeto "${selectedProject.name}"? Ele deixara de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    deleteProjectMutation.mutate(selectedProject.id);
  }

  return (
    <Panel title="Editar projeto">
      {selectedProject ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <strong className="block text-slate-900">Projeto selecionado</strong>
              <span className="break-all font-mono text-xs text-stone-600">
                {selectedProject.slug}
              </span>
            </div>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
              {selectedProject.currentUserProjectRole ?? organizationRole ?? "sem role"}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <Stat label="Membros" value={selectedProject.memberCount ?? 0} />
            <Stat
              label="Configs"
              value={selectedProject.configCount ?? selectedProject.configs?.length ?? 0}
            />
            <Stat
              label="Environments"
              value={selectedProject.environmentCount ?? selectedProject.environments?.length ?? 0}
            />
          </dl>
          <div className="mt-4 grid gap-3">
            <UpdateNameForm
              disabled={updateProjectMutation.isPending || !canManageSelectedProject}
              name={selectedProject.name}
              onSubmit={(name) =>
                updateProjectMutation.mutateAsync({
                  name,
                  projectId: selectedProject.id,
                })
              }
            />
            <ErrorMessage error={updateProjectMutation.error} />
            <ErrorMessage error={deleteProjectMutation.error} />
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
                to={projectsPath(selectedOrganizationId)}
              >
                Voltar
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
                to={configsPath(selectedOrganizationId, selectedProject.id)}
              >
                Ver configs
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
                to={environmentsPath(selectedOrganizationId, selectedProject.id)}
              >
                Ver environments
              </Link>
              <Button
                disabled={deleteProjectMutation.isPending || !canManageSelectedProject}
                onClick={deleteSelectedProject}
                type="button"
                variant="danger"
              >
                Excluir projeto
              </Button>
            </div>
            {!canManageSelectedProject ? (
              <PermissionHint>
                Somente owner, admin ou project_admin pode editar/excluir projetos.
              </PermissionHint>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-stone-600">Projeto nao encontrado.</p>
          <Link
            className="mt-4 inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
            to={projectsPath(selectedOrganizationId)}
          >
            Voltar para projetos
          </Link>
        </div>
      )}
    </Panel>
  );
}

type ProjectListProps = {
  projects: ReturnType<typeof useProjectRouteContext>["projects"];
  selectedOrganizationId: string;
};

function ProjectList({ projects, selectedOrganizationId }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Sem projetos.</p>;
  }

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Projeto</TableHead>
            <TableHead>Membros</TableHead>
            <TableHead>Configs</TableHead>
            <TableHead>Environments</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow className="text-slate-800" key={project.id}>
              <TableCell className="min-w-52">
                <strong className="block text-slate-900">{project.name}</strong>
                <span className="block break-all font-mono text-xs text-stone-600">
                  {project.slug}
                </span>
              </TableCell>
              <TableCell className="font-medium">{project.memberCount ?? 0}</TableCell>
              <TableCell className="font-medium">
                {project.configCount ?? project.configs?.length ?? 0}
              </TableCell>
              <TableCell className="font-medium">
                {project.environmentCount ?? project.environments?.length ?? 0}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Link
                    className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
                    to={projectsPath(selectedOrganizationId, project.id)}
                  >
                    Editar
                  </Link>
                  <Link
                    className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 no-underline shadow-sm transition hover:bg-slate-50"
                    to={configsPath(selectedOrganizationId, project.id)}
                  >
                    Configs
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

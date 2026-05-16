import cls from "classnames";
import { Link, useNavigate } from "react-router-dom";
import { useCreateProject, useDeleteProject, useUpdateProject } from "../../api/projects";
import { Button, CreateNameForm, ErrorMessage, Panel, PermissionHint } from "../../components";
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
  const {
    organizationRole,
    projects,
    projectsQuery,
    selectedOrganizationId,
    selectedProject,
    selectedProjectId,
  } = useProjectRouteContext();
  const isOrganizationAdmin = canManageOrganizationMembers(organizationRole);
  const createProjectMutation = useCreateProject({
    organizationId: selectedOrganizationId,
    onSuccess: (project) => {
      if (project.organizationId === selectedOrganizationId) {
        navigate(projectsPath(selectedOrganizationId, project.id));
      }
    },
  });
  const updateProjectMutation = useUpdateProject({ organizationId: selectedOrganizationId });
  const deleteProjectMutation = useDeleteProject({
    organizationId: selectedOrganizationId,
    onSuccess: () => navigate(projectsPath(selectedOrganizationId)),
  });
  const createDisabled =
    !selectedOrganizationId || !isOrganizationAdmin || createProjectMutation.isPending;
  const permissionHint = !isOrganizationAdmin
    ? "Somente owner ou admin pode criar projetos."
    : undefined;
  const canManageSelectedProject = Boolean(
    selectedProjectId &&
      canManageProjectResources(organizationRole, selectedProject?.currentUserProjectRole ?? null),
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
    <Panel title="Projetos">
      <CreateNameForm
        disabled={createDisabled}
        onSubmit={createProjectMutation.mutateAsync}
        placeholder="Novo projeto"
      />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={projectsQuery.error} />
      <ErrorMessage error={createProjectMutation.error} />
      <ProjectList
        projects={projects}
        selectedOrganizationId={selectedOrganizationId}
        selectedProjectId={selectedProjectId}
      />
      {projectsQuery.isFetching ? (
        <p className="mt-4 text-sm text-stone-600">Atualizando projetos...</p>
      ) : null}
      {selectedProject ? (
        <div className="mt-5 rounded-2xl bg-[#f4f0e8] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <strong className="block text-slate-900">Projeto selecionado</strong>
              <span className="break-all font-mono text-xs text-stone-600">
                {selectedProject.slug}
              </span>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase text-stone-700">
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
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-3 font-bold text-slate-900 no-underline transition hover:border-slate-500"
                to={configsPath(selectedOrganizationId, selectedProject.id)}
              >
                Ver configs
              </Link>
              <Link
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-3 font-bold text-slate-900 no-underline transition hover:border-slate-500"
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
        <p className="mt-4 text-sm text-stone-600">Crie ou selecione um projeto.</p>
      )}
    </Panel>
  );
}

type ProjectListProps = {
  projects: ReturnType<typeof useProjectRouteContext>["projects"];
  selectedOrganizationId: string;
  selectedProjectId: string;
};

function ProjectList({ projects, selectedOrganizationId, selectedProjectId }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Sem projetos.</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {projects.map((project) => {
        const isSelected = project.id === selectedProjectId;

        return (
          <div
            className={cls("grid gap-3 rounded-2xl p-4 text-sm lg:grid-cols-[1fr_auto]", {
              "bg-slate-900 text-white": isSelected,
              "bg-[#f4f0e8] text-slate-800": !isSelected,
            })}
            key={project.id}
          >
            <Link
              className="min-w-0 text-left text-inherit no-underline"
              to={projectsPath(selectedOrganizationId, project.id)}
            >
              <strong className="block truncate">{project.name}</strong>
              <span className="block break-all font-mono text-xs opacity-80">{project.slug}</span>
              <span className="mt-2 flex flex-wrap gap-2 text-xs opacity-90">
                <span>{project.memberCount ?? 0} membros</span>
                <span>{project.configCount ?? project.configs?.length ?? 0} configs</span>
                <span>
                  {project.environmentCount ?? project.environments?.length ?? 0} environments
                </span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                className={cls("rounded-xl border px-3 py-2 font-bold no-underline transition", {
                  "border-white/20 bg-white/10 text-white hover:bg-white/15": isSelected,
                  "border-slate-300 bg-white/80 text-slate-900 hover:border-slate-500": !isSelected,
                })}
                to={projectsPath(selectedOrganizationId, project.id)}
              >
                Editar
              </Link>
              <Link
                className={cls("rounded-xl border px-3 py-2 font-bold no-underline transition", {
                  "border-white/20 bg-white/10 text-white hover:bg-white/15": isSelected,
                  "border-slate-300 bg-white/80 text-slate-900 hover:border-slate-500": !isSelected,
                })}
                to={configsPath(selectedOrganizationId, project.id)}
              >
                Configs
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.08em] text-stone-500">{label}</dt>
      <dd className="mt-1 text-2xl font-black text-slate-900">{value}</dd>
    </div>
  );
}

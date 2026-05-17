import { useCreateProject, useDeleteProject, useUpdateProject } from "@api/projects";
import { ActionMenu, ActionMenuItem, ActionMenuLink } from "@components/ActionMenu";
import { Button } from "@components/Button";
import { CreateNameForm } from "@components/CreateNameForm";
import { DataToolbar, SearchField } from "@components/DataToolbar";
import { ErrorMessage } from "@components/ErrorMessage";
import { InlineNameEditor } from "@components/InlineNameEditor";
import { Panel } from "@components/Panel";
import { PermissionHint } from "@components/PermissionHint";
import {
  BulkActions,
  ColumnHeader,
  Pagination,
  SelectionCheckbox,
  Table,
  useTable,
} from "@components/table";
import { configsPath, environmentsPath, projectsPath } from "@routing/routePaths";
import { useProjectRouteContext } from "@routing/useRouteContext";
import { canManageOrganizationMembers, canManageProjectResources } from "@src/permissions";
import type { Project } from "@src/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
  const deleteProjectMutation = useDeleteProject({ organizationId: selectedOrganizationId });
  const createDisabled =
    !selectedOrganizationId || !isOrganizationAdmin || createProjectMutation.isPending;
  const permissionHint = !isOrganizationAdmin
    ? "Somente owner ou admin pode criar projetos."
    : undefined;

  function canDeleteProject(project: Project) {
    return canManageProjectResources(organizationRole, project.currentUserProjectRole ?? null);
  }

  function deleteProject(project: Project) {
    if (!canDeleteProject(project)) {
      return;
    }

    const shouldDelete = window.confirm(
      `Arquivar o projeto "${project.name}"? Ele deixara de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    deleteProjectMutation.mutate(project.id);
  }

  function deleteProjects(selectedProjects: Project[]) {
    const deletableProjects = selectedProjects.filter(canDeleteProject);
    if (deletableProjects.length === 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `Arquivar ${formatProjectSelectionLabel(deletableProjects.length)}? Eles deixarao de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    for (const project of deletableProjects) {
      deleteProjectMutation.mutate(project.id);
    }
  }

  return (
    <Panel showTitle={false} title="Projetos">
      <CreateNameForm
        disabled={createDisabled}
        onSubmit={createProjectMutation.mutateAsync}
        placeholder="Novo projeto"
      />
      {permissionHint ? <PermissionHint>{permissionHint}</PermissionHint> : null}
      <ErrorMessage error={projectsQuery.error} />
      <ErrorMessage error={createProjectMutation.error} />
      <ErrorMessage error={deleteProjectMutation.error} />
      <ProjectList
        canDeleteProject={canDeleteProject}
        isDeleting={deleteProjectMutation.isPending}
        onBulkDelete={deleteProjects}
        onDelete={deleteProject}
        projects={projects}
        selectedOrganizationId={selectedOrganizationId}
      />
      {projectsQuery.isFetching ? (
        <p className="mt-4 text-sm text-muted-foreground">Atualizando projetos...</p>
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
    <section className="grid gap-4 text-foreground">
      {selectedProject ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <InlineNameEditor
                  canEdit={canManageSelectedProject}
                  disabled={updateProjectMutation.isPending}
                  displayAs="h1"
                  displayClassName="truncate text-2xl font-bold tracking-tight text-foreground"
                  editLabel={`Editar ${selectedProject.name}`}
                  inputClassName="h-10 text-lg font-semibold sm:w-[28rem] sm:text-xl"
                  onSubmit={(name) =>
                    updateProjectMutation.mutateAsync({
                      name,
                      projectId: selectedProject.id,
                    })
                  }
                  name={selectedProject.name}
                />
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase text-foreground">
                  {selectedProject.currentUserProjectRole ?? organizationRole ?? "sem role"}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Edite dados do projeto, navegue pelos recursos e gerencie membros do escopo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
                to={projectsPath(selectedOrganizationId)}
              >
                Voltar
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
                to={configsPath(selectedOrganizationId, selectedProject.id)}
              >
                Ver configs
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
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
          </div>
          <dl className="flex flex-wrap gap-3 text-sm">
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
          <ErrorMessage error={updateProjectMutation.error} />
          <ErrorMessage error={deleteProjectMutation.error} />
          {!canManageSelectedProject ? (
            <PermissionHint>
              Somente owner, admin ou project_admin pode editar/excluir projetos.
            </PermissionHint>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Projeto nao encontrado.</p>
          <Link
            className="mt-4 inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
            to={projectsPath(selectedOrganizationId)}
          >
            Voltar para projetos
          </Link>
        </div>
      )}
    </section>
  );
}

type ProjectListProps = {
  canDeleteProject: (project: Project) => boolean;
  isDeleting: boolean;
  onBulkDelete: (projects: Project[]) => void;
  onDelete: (project: Project) => void;
  projects: ReturnType<typeof useProjectRouteContext>["projects"];
  selectedOrganizationId: string;
};

function ProjectList({
  canDeleteProject,
  isDeleting,
  onBulkDelete,
  onDelete,
  projects,
  selectedOrganizationId,
}: ProjectListProps) {
  const navigate = useNavigate();
  const columns: ColumnDef<Project>[] = [
    {
      cell: ({ row }) => (
        <SelectionCheckbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <SelectionCheckbox
          aria-label="Selecionar projetos da pagina"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
        />
      ),
      id: "select",
      meta: { className: "w-10" },
    },
    {
      accessorFn: (project) => project.name,
      cell: ({ row }) => (
        <div>
          <strong className="block text-foreground">{row.original.name}</strong>
          <span className="block break-all font-mono text-xs text-muted-foreground">
            {row.original.slug}
          </span>
        </div>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Projeto" />,
      id: "project",
      meta: { tdClassName: "min-w-52" },
    },
    {
      accessorFn: (project) => project.memberCount ?? 0,
      cell: ({ row }) => <span className="font-medium">{row.original.memberCount ?? 0}</span>,
      header: ({ column }) => <ColumnHeader column={column} title="Membros" />,
      id: "memberCount",
    },
    {
      accessorFn: projectConfigCount,
      cell: ({ row }) => <span className="font-medium">{projectConfigCount(row.original)}</span>,
      header: ({ column }) => <ColumnHeader column={column} title="Configs" />,
      id: "configCount",
    },
    {
      accessorFn: projectEnvironmentCount,
      cell: ({ row }) => (
        <span className="font-medium">{projectEnvironmentCount(row.original)}</span>
      ),
      header: ({ column }) => <ColumnHeader column={column} title="Environments" />,
      id: "environmentCount",
    },
    {
      cell: ({ row }) => (
        <ActionMenu label={`Acoes para ${row.original.name}`}>
          <ActionMenuLink to={projectsPath(selectedOrganizationId, row.original.id)}>
            Editar
          </ActionMenuLink>
          <ActionMenuLink to={configsPath(selectedOrganizationId, row.original.id)}>
            Configs
          </ActionMenuLink>
          <ActionMenuItem
            destructive
            disabled={isDeleting || !canDeleteProject(row.original)}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Excluir
          </ActionMenuItem>
        </ActionMenu>
      ),
      enableHiding: false,
      enableSorting: false,
      header: "Acoes",
      id: "actions",
      meta: { className: "w-10 text-right" },
    },
  ];
  const table = useTable({
    columns,
    data: projects,
    enableRowSelection: (row) => canDeleteProject(row.original),
    getRowId: (project) => project.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      [row.original.name, row.original.slug]
        .join(" ")
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
  });
  const selectedProjects = table.getFilteredSelectedRowModel().rows.map((row) => row.original);

  return (
    <div className="mt-4 grid gap-4">
      <DataToolbar>
        <SearchField
          aria-label="Filtrar projetos"
          onChange={(event) => {
            table.setGlobalFilter(event.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Filter by name or slug..."
          value={table.getState().globalFilter ?? ""}
        />
      </DataToolbar>
      <Table
        emptyMessage={projects.length === 0 ? "Sem projetos." : "Nenhum projeto encontrado."}
        getRowAriaLabel={(row) => `Editar ${row.original.name}`}
        getRowClassName={() => "text-foreground"}
        onRowActivate={(row) => navigate(projectsPath(selectedOrganizationId, row.original.id))}
        rowActivationRole="link"
        table={table}
      />
      <Pagination table={table} />
      <BulkActions
        selectionLabel={(selectedCount) => formatProjectSelectionLabel(selectedCount)}
        table={table}
      >
        <Button
          disabled={isDeleting || selectedProjects.length === 0}
          onClick={() => {
            onBulkDelete(selectedProjects);
            table.resetRowSelection();
          }}
          type="button"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Excluir
        </Button>
      </BulkActions>
    </div>
  );
}

function projectConfigCount(project: Project) {
  return project.configCount ?? project.configs?.length ?? 0;
}

function projectEnvironmentCount(project: Project) {
  return project.environmentCount ?? project.environments?.length ?? 0;
}

function formatProjectSelectionLabel(selectedCount: number) {
  return selectedCount === 1 ? "1 projeto selecionado" : `${selectedCount} projetos selecionados`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-36 rounded-lg border border-border bg-background p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useDeleteOrganization, useUpdateOrganization } from "../../api/organizations";
import { Button, ErrorMessage, InlineNameEditor, PermissionHint } from "../../components";
import { canManageOrganizationMembers } from "../../permissions";
import { projectsPath } from "../../routing/routePaths";
import { useOrganizationRouteContext } from "../../routing/useRouteContext";

export function OrganizationPanel() {
  const navigate = useNavigate();
  const { selectedOrganization } = useOrganizationRouteContext();
  const updateOrganizationMutation = useUpdateOrganization();
  const deleteOrganizationMutation = useDeleteOrganization({
    onSuccess: () => navigate("/organizations"),
  });
  const canManageSelectedOrganization = canManageOrganizationMembers(selectedOrganization?.role);
  const canDeleteSelectedOrganization = selectedOrganization?.role === "owner";

  function deleteSelectedOrganization() {
    if (!selectedOrganization || !canDeleteSelectedOrganization) {
      return;
    }

    const shouldDelete = window.confirm(
      `Arquivar a organizacao "${selectedOrganization.name}"? Ela deixara de aparecer nas listagens.`,
    );
    if (!shouldDelete) {
      return;
    }

    deleteOrganizationMutation.mutate(selectedOrganization.id);
  }

  return (
    <section className="grid gap-4 text-foreground">
      {selectedOrganization ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <InlineNameEditor
                  canEdit={canManageSelectedOrganization}
                  disabled={updateOrganizationMutation.isPending}
                  displayAs="h1"
                  displayClassName="truncate text-2xl font-bold tracking-tight text-foreground"
                  editLabel={`Editar ${selectedOrganization.name}`}
                  inputClassName="h-10 text-lg font-semibold sm:w-[28rem] sm:text-xl"
                  onSubmit={(name) =>
                    updateOrganizationMutation.mutateAsync({
                      organizationId: selectedOrganization.id,
                      name,
                    })
                  }
                  name={selectedOrganization.name}
                />
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase text-foreground">
                  {selectedOrganization.role}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Edite o nome da organizacao e gerencie membros do tenant.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
                to="/organizations"
              >
                Voltar
              </Link>
              <Link
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
                to={projectsPath(selectedOrganization.id)}
              >
                Ver projetos
              </Link>
              <Button
                disabled={deleteOrganizationMutation.isPending || !canDeleteSelectedOrganization}
                onClick={deleteSelectedOrganization}
                type="button"
                variant="danger"
              >
                Excluir organizacao
              </Button>
            </div>
          </div>
          <dl className="flex flex-wrap gap-3 text-sm">
            <Stat label="Projetos" value={selectedOrganization.projectCount} />
            <Stat label="Membros" value={selectedOrganization.memberCount} />
          </dl>
          <ErrorMessage error={updateOrganizationMutation.error} />
          <ErrorMessage error={deleteOrganizationMutation.error} />
          {!canDeleteSelectedOrganization ? (
            <PermissionHint>Somente owner pode excluir a organizacao.</PermissionHint>
          ) : null}
          {!canManageSelectedOrganization ? (
            <PermissionHint>Somente owner ou admin pode editar a organizacao.</PermissionHint>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Organizacao nao encontrada.</p>
          <Link
            className="mt-4 inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground no-underline shadow-xs transition hover:bg-accent hover:text-accent-foreground"
            to="/organizations"
          >
            Voltar para organizacoes
          </Link>
        </div>
      )}
    </section>
  );
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

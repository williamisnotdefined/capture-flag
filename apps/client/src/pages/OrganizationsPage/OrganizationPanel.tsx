import { Link, useNavigate } from "react-router-dom";
import { useDeleteOrganization, useUpdateOrganization } from "../../api/organizations";
import { Button, ErrorMessage, Panel, PermissionHint } from "../../components";
import { UpdateNameForm } from "../../components/UpdateNameForm";
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
    <Panel title="Editar organizacao">
      {selectedOrganization ? (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <strong className="block text-foreground">Organizacao selecionada</strong>
              <span className="break-all font-mono text-xs text-muted-foreground">
                {selectedOrganization.slug}
              </span>
            </div>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase text-foreground">
              {selectedOrganization.role}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Stat label="Projetos" value={selectedOrganization.projectCount} />
            <Stat label="Membros" value={selectedOrganization.memberCount} />
          </dl>
          <div className="mt-4 grid gap-3">
            <UpdateNameForm
              disabled={updateOrganizationMutation.isPending || !canManageSelectedOrganization}
              name={selectedOrganization.name}
              onSubmit={(name) =>
                updateOrganizationMutation.mutateAsync({
                  organizationId: selectedOrganization.id,
                  name,
                })
              }
            />
            <ErrorMessage error={updateOrganizationMutation.error} />
            <ErrorMessage error={deleteOrganizationMutation.error} />
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
            {!canDeleteSelectedOrganization ? (
              <PermissionHint>Somente owner pode excluir a organizacao.</PermissionHint>
            ) : null}
            {!canManageSelectedOrganization ? (
              <PermissionHint>Somente owner ou admin pode editar a organizacao.</PermissionHint>
            ) : null}
          </div>
        </div>
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
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}

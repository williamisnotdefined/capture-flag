import cls from "classnames";
import { Link, useNavigate } from "react-router-dom";
import {
  useCreateOrganization,
  useDeleteOrganization,
  useUpdateOrganization,
} from "../../api/organizations";
import { Button, CreateNameForm, ErrorMessage, Panel, PermissionHint } from "../../components";
import { UpdateNameForm } from "../../components/UpdateNameForm";
import { organizationPath, projectsPath } from "../../layouts/PlatformLayout/routePaths";
import { useOrganizationRouteContext } from "../../layouts/PlatformLayout/useRouteContext";
import { canManageOrganizationMembers } from "../../permissions";

export function OrganizationPanel() {
  const navigate = useNavigate();
  const { organizations, selectedOrganization, selectedOrganizationId } =
    useOrganizationRouteContext();
  const createOrganizationMutation = useCreateOrganization({
    onSuccess: (organization) => navigate(organizationPath(organization.id)),
  });
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
    <Panel title="Organizacoes">
      <CreateNameForm
        disabled={createOrganizationMutation.isPending}
        onSubmit={createOrganizationMutation.mutateAsync}
        placeholder="Nova organizacao"
      />
      <ErrorMessage error={createOrganizationMutation.error} />
      <OrganizationList
        isDeleting={deleteOrganizationMutation.isPending}
        organizations={organizations}
        onDelete={(organizationId) => deleteOrganizationMutation.mutate(organizationId)}
        selectedOrganizationId={selectedOrganizationId}
      />
      {selectedOrganization ? (
        <div className="mt-5 rounded-2xl bg-[#f4f0e8] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <strong className="block text-slate-900">Organizacao selecionada</strong>
              <span className="break-all font-mono text-xs text-stone-600">
                {selectedOrganization.slug}
              </span>
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase text-stone-700">
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
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-3 font-bold text-slate-900 no-underline transition hover:border-slate-500"
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
        <p className="mt-4 text-sm text-stone-600">Crie uma organizacao para comecar.</p>
      )}
    </Panel>
  );
}

type OrganizationListProps = {
  isDeleting: boolean;
  organizations: ReturnType<typeof useOrganizationRouteContext>["organizations"];
  onDelete: (organizationId: string) => void;
  selectedOrganizationId: string;
};

function OrganizationList({
  isDeleting,
  organizations,
  onDelete,
  selectedOrganizationId,
}: OrganizationListProps) {
  if (organizations.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Sem organizacoes.</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {organizations.map((organization) => {
        const isSelected = organization.id === selectedOrganizationId;

        return (
          <div
            className={cls("grid gap-3 rounded-2xl p-4 text-sm lg:grid-cols-[1fr_auto]", {
              "bg-slate-900 text-white": isSelected,
              "bg-[#f4f0e8] text-slate-800": !isSelected,
            })}
            key={organization.id}
          >
            <Link
              className="min-w-0 text-left text-inherit no-underline"
              to={organizationPath(organization.id)}
            >
              <strong className="block truncate">{organization.name}</strong>
              <span className="block break-all font-mono text-xs opacity-80">
                {organization.slug}
              </span>
              <span className="mt-2 flex flex-wrap gap-2 text-xs opacity-90">
                <span>{organization.projectCount} projetos</span>
                <span>{organization.memberCount} membros</span>
                <span>{organization.role}</span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                className={cls("rounded-xl border px-3 py-2 font-bold no-underline transition", {
                  "border-white/20 bg-white/10 text-white hover:bg-white/15": isSelected,
                  "border-slate-300 bg-white/80 text-slate-900 hover:border-slate-500": !isSelected,
                })}
                to={organizationPath(organization.id)}
              >
                Editar
              </Link>
              <Link
                className={cls("rounded-xl border px-3 py-2 font-bold no-underline transition", {
                  "border-white/20 bg-white/10 text-white hover:bg-white/15": isSelected,
                  "border-slate-300 bg-white/80 text-slate-900 hover:border-slate-500": !isSelected,
                })}
                to={projectsPath(organization.id)}
              >
                Projetos
              </Link>
              <Button
                disabled={isDeleting || organization.role !== "owner"}
                onClick={() => {
                  const shouldDelete = window.confirm(
                    `Arquivar a organizacao "${organization.name}"? Ela deixara de aparecer nas listagens.`,
                  );
                  if (shouldDelete) {
                    onDelete(organization.id);
                  }
                }}
                type="button"
                variant="danger"
              >
                Excluir
              </Button>
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

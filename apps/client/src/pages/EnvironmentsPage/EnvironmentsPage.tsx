import { useProjectResourcesRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageProjectResources } from "../_shared/permissions";
import { EnvironmentsPanel } from "./EnvironmentsPanel";

export function EnvironmentsPage() {
  const {
    environments,
    environmentsQuery,
    organizationRole,
    selectedEnvironmentId,
    selectedProject,
    selectedProjectId,
    setSelectedEnvironmentId,
  } = useProjectResourcesRouteContext();
  const canManageProjectResourceActions = canManageProjectResources(
    organizationRole,
    selectedProject?.currentUserProjectRole ?? null,
  );

  return (
    <>
      <PageHeader
        description="Ambientes representam os runtimes onde valores de flags, SDK keys e previews sao publicados."
        eyebrow="Projeto selecionado"
        title="Environments"
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <EnvironmentsPanel
          canManageProjectResources={canManageProjectResourceActions}
          environments={environments}
          onSelect={setSelectedEnvironmentId}
          queryError={environmentsQuery.error}
          selectedEnvironmentId={selectedEnvironmentId}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </>
  );
}

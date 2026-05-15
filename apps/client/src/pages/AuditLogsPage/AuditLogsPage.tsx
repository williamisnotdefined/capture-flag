import { useProjectRouteContext } from "../PlatformLayout/useRouteContext";
import { PageHeader } from "../_shared/PageHeader";
import { canManageOrganizationMembers } from "../_shared/permissions";
import { AuditLogsPanel } from "./AuditLogsPanel";

export function AuditLogsPage() {
  const { organizationRole, selectedOrganizationId, selectedProjectId } = useProjectRouteContext();
  const canViewOrganizationAudit = canManageOrganizationMembers(organizationRole);

  return (
    <>
      <PageHeader
        description="Investigue eventos por projeto ou pela organizacao inteira, com filtros por acao, entidade, usuario e periodo."
        eyebrow="Compliance"
        title="Audit Logs"
      />
      <AuditLogsPanel
        canViewOrganizationAudit={canViewOrganizationAudit}
        organizationId={selectedOrganizationId}
        projectId={selectedProjectId}
      />
    </>
  );
}

import { PageLayout } from "../../components";
import { AuditLogsPanel } from "./AuditLogsPanel";

export function AuditLogsPage() {
  return (
    <PageLayout
      description="Investigue eventos por projeto ou pela organizacao inteira, com filtros por acao, entidade, usuario e periodo."
      eyebrow="Compliance"
      title="Audit Logs"
    >
      <AuditLogsPanel />
    </PageLayout>
  );
}

import { PageLayout } from "../../components";
import { OrganizationMembersSection } from "./OrganizationMembersSection";
import { OrganizationPanel } from "./OrganizationPanel";

export function OrganizationsPage() {
  return (
    <PageLayout
      contentClassName="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      description="Escolha a organizacao ativa, crie novos tenants e gerencie os usuarios globais daquela organizacao."
      eyebrow="Tenant"
      title="Organizacoes"
    >
      <OrganizationPanel />
      <OrganizationMembersSection />
    </PageLayout>
  );
}

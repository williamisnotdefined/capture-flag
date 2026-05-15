import { useCreateOrganization } from "../../api/organizations";
import { CreateNameForm, ErrorMessage, Panel, SelectInput } from "../../components";
import type { Organization } from "../../types";

type OrganizationPanelProps = {
  onCreated: (organization: Organization) => void;
  onSelect: (organizationId: string) => void;
  organizations: Organization[];
  selectedOrganizationId: string;
};

export function OrganizationPanel({
  onCreated,
  onSelect,
  organizations,
  selectedOrganizationId,
}: OrganizationPanelProps) {
  const createOrganizationMutation = useCreateOrganization({ onSuccess: onCreated });

  return (
    <Panel title="Organizacoes">
      <CreateNameForm
        disabled={createOrganizationMutation.isPending}
        onSubmit={createOrganizationMutation.mutateAsync}
        placeholder="Nova organizacao"
      />
      <ErrorMessage error={createOrganizationMutation.error} />
      <SelectInput
        className="mt-3 w-full"
        onChange={(event) => onSelect(event.target.value)}
        value={selectedOrganizationId}
      >
        <option value="">Selecione</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name} ({organization.role})
          </option>
        ))}
      </SelectInput>
    </Panel>
  );
}

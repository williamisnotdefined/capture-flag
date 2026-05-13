import { CreateNameForm } from "../../components/CreateNameForm";
import { Panel } from "../../components/Panel";
import { ErrorMessage, SelectInput } from "../../components/ui";
import type { Organization } from "../../types";

type OrganizationPanelProps = {
  createError: unknown;
  isCreating: boolean;
  onCreate: (name: string) => Promise<unknown>;
  onSelect: (organizationId: string) => void;
  organizations: Organization[];
  selectedOrganizationId: string;
};

export function OrganizationPanel({
  createError,
  isCreating,
  onCreate,
  onSelect,
  organizations,
  selectedOrganizationId,
}: OrganizationPanelProps) {
  return (
    <Panel title="Organizacoes">
      <CreateNameForm disabled={isCreating} onSubmit={onCreate} placeholder="Nova organizacao" />
      <ErrorMessage error={createError} />
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

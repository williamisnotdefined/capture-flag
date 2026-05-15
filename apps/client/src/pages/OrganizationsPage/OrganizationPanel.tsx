import { useNavigate } from "react-router-dom";
import { useCreateOrganization } from "../../api/organizations";
import { CreateNameForm, ErrorMessage, Panel, SelectInput } from "../../components";
import { organizationPath } from "../PlatformLayout/routePaths";
import { useOrganizationRouteContext } from "../PlatformLayout/useRouteContext";

export function OrganizationPanel() {
  const navigate = useNavigate();
  const { organizations, selectedOrganizationId } = useOrganizationRouteContext();
  const createOrganizationMutation = useCreateOrganization({
    onSuccess: (organization) => navigate(organizationPath(organization.id)),
  });

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
        onChange={(event) => navigate(organizationPath(event.target.value))}
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

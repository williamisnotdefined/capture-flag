import { useOrganizationRouteContext } from "../../routing/useRouteContext";
import { OrganizationMembersSection } from "./OrganizationMembersSection";
import { OrganizationPanel } from "./OrganizationPanel";

export function OrganizationEditPage() {
  const { selectedOrganization } = useOrganizationRouteContext();

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <OrganizationPanel />
      {selectedOrganization ? <OrganizationMembersSection /> : null}
    </div>
  );
}

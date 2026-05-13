import { useEffect, useState } from "react";
import type { Organization } from "../../../types";

export function useOrganizationSelection(organizations: Organization[]) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [pendingSelectedOrganizationId, setPendingSelectedOrganizationId] = useState("");

  useEffect(() => {
    const selectedOrganizationExists = organizations.some(
      (organization) => organization.id === selectedOrganizationId,
    );

    if (
      pendingSelectedOrganizationId &&
      selectedOrganizationId === pendingSelectedOrganizationId &&
      !selectedOrganizationExists
    ) {
      return;
    }

    if (
      pendingSelectedOrganizationId &&
      (selectedOrganizationExists || selectedOrganizationId !== pendingSelectedOrganizationId)
    ) {
      setPendingSelectedOrganizationId("");
    }

    const nextOrganizationId = selectedOrganizationExists
      ? selectedOrganizationId
      : (organizations[0]?.id ?? "");

    if (selectedOrganizationId !== nextOrganizationId) {
      setSelectedOrganizationId(nextOrganizationId);
    }
  }, [organizations, pendingSelectedOrganizationId, selectedOrganizationId]);

  function selectCreatedOrganization(organization: Organization) {
    setPendingSelectedOrganizationId(organization.id);
    setSelectedOrganizationId(organization.id);
  }

  function resetOrganizationSelection() {
    setPendingSelectedOrganizationId("");
    setSelectedOrganizationId("");
  }

  return {
    resetOrganizationSelection,
    selectCreatedOrganization,
    selectOrganizationId: setSelectedOrganizationId,
    selectedOrganization: organizations.find(
      (organization) => organization.id === selectedOrganizationId,
    ),
    selectedOrganizationId,
  };
}

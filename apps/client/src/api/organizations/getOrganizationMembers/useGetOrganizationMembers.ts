import { organizationQueryKeys } from "@api/organizations/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationMembers } from "./getOrganizationMembers";

export function useGetOrganizationMembers(organizationId: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getOrganizationMembers(organizationId),
    queryKey: organizationQueryKeys.members(organizationId),
  });
}

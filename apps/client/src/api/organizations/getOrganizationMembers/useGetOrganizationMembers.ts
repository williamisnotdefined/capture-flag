import { useQuery } from "@tanstack/react-query";
import { organizationQueryKeys } from "../queryKeys";
import { getOrganizationMembers } from "./getOrganizationMembers";

export function useGetOrganizationMembers(organizationId: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getOrganizationMembers(organizationId),
    queryKey: organizationQueryKeys.members(organizationId),
  });
}

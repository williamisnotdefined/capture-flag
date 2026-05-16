import { projectQueryKeys } from "@api/projects/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "./getProjects";

export function useGetProjects(organizationId: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getProjects(organizationId),
    queryKey: projectQueryKeys.list(organizationId),
  });
}

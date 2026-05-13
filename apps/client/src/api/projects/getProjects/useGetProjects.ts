import { useQuery } from "@tanstack/react-query";
import { projectQueryKeys } from "../queryKeys";
import { getProjects } from "./getProjects";

export function useGetProjects(organizationId: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getProjects(organizationId),
    queryKey: projectQueryKeys.list(organizationId),
  });
}

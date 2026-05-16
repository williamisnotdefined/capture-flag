import { projectQueryKeys } from "@api/projects/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getProjectMembers } from "./getProjectMembers";

export function useGetProjectMembers(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectMembers(projectId),
    queryKey: projectQueryKeys.members(projectId),
  });
}

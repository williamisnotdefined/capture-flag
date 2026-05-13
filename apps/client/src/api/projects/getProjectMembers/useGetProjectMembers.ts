import { useQuery } from "@tanstack/react-query";
import { projectQueryKeys } from "../queryKeys";
import { getProjectMembers } from "./getProjectMembers";

export function useGetProjectMembers(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectMembers(projectId),
    queryKey: projectQueryKeys.members(projectId),
  });
}

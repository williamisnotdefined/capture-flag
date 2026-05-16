import { environmentQueryKeys } from "@api/environments/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getProjectEnvironments } from "./getProjectEnvironments";

export function useGetProjectEnvironments(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectEnvironments(projectId),
    queryKey: environmentQueryKeys.list(projectId),
  });
}

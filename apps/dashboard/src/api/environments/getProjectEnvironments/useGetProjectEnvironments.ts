import { useQuery } from "@tanstack/react-query";
import { environmentQueryKeys } from "../queryKeys";
import { getProjectEnvironments } from "./getProjectEnvironments";

export function useGetProjectEnvironments(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectEnvironments(projectId),
    queryKey: environmentQueryKeys.list(projectId),
  });
}

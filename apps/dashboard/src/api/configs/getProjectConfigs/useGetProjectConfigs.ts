import { useQuery } from "@tanstack/react-query";
import { configQueryKeys } from "../queryKeys";
import { getProjectConfigs } from "./getProjectConfigs";

export function useGetProjectConfigs(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectConfigs(projectId),
    queryKey: configQueryKeys.list(projectId),
  });
}

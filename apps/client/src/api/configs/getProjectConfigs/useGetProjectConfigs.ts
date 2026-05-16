import { configQueryKeys } from "@api/configs/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getProjectConfigs } from "./getProjectConfigs";

export function useGetProjectConfigs(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectConfigs(projectId),
    queryKey: configQueryKeys.list(projectId),
  });
}

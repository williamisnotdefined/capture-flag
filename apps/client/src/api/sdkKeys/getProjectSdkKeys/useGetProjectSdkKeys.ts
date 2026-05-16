import { sdkKeyQueryKeys } from "@api/sdkKeys/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getProjectSdkKeys } from "./getProjectSdkKeys";

export function useGetProjectSdkKeys(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectSdkKeys(projectId),
    queryKey: sdkKeyQueryKeys.list(projectId),
  });
}

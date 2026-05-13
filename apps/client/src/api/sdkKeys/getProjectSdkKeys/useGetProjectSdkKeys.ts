import { useQuery } from "@tanstack/react-query";
import { sdkKeyQueryKeys } from "../queryKeys";
import { getProjectSdkKeys } from "./getProjectSdkKeys";

export function useGetProjectSdkKeys(projectId: string) {
  return useQuery({
    enabled: Boolean(projectId),
    queryFn: () => getProjectSdkKeys(projectId),
    queryKey: sdkKeyQueryKeys.list(projectId),
  });
}

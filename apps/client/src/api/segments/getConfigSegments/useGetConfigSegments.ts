import { useQuery } from "@tanstack/react-query";
import { segmentQueryKeys } from "../queryKeys";
import { getConfigSegments } from "./getConfigSegments";

export function useGetConfigSegments(configId: string) {
  return useQuery({
    enabled: Boolean(configId),
    queryFn: () => getConfigSegments(configId),
    queryKey: segmentQueryKeys.list(configId),
  });
}

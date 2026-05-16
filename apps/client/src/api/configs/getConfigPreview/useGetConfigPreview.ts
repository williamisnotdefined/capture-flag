import { configQueryKeys } from "@api/configs/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getConfigPreview } from "./getConfigPreview";

type UseGetConfigPreviewInput = {
  configId: string;
  environmentId: string;
};

export function useGetConfigPreview({ configId, environmentId }: UseGetConfigPreviewInput) {
  return useQuery({
    enabled: Boolean(configId && environmentId),
    queryFn: () => getConfigPreview({ configId, environmentId }),
    queryKey: configQueryKeys.preview(configId, environmentId),
  });
}

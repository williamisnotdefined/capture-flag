import { apiRequest } from "@api/client";
import type { ConfigPreview } from "@src/types";

type GetConfigPreviewInput = {
  configId: string;
  environmentId: string;
};

export function getConfigPreview({ configId, environmentId }: GetConfigPreviewInput) {
  return apiRequest<ConfigPreview>(
    `/configs/${configId}/environments/${environmentId}/config-preview`,
  );
}

import type { ConfigPreview } from "../../../types";
import { apiRequest } from "../../client";

type GetConfigPreviewInput = {
  configId: string;
  environmentId: string;
};

export function getConfigPreview({ configId, environmentId }: GetConfigPreviewInput) {
  return apiRequest<ConfigPreview>(
    `/configs/${configId}/environments/${environmentId}/config-preview`,
  );
}

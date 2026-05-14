import type { AuditLog } from "../../../types";
import { apiRequest } from "../../client";

type GetFeatureFlagActivityInput = {
  configId: string;
  featureFlagId: string;
};

export function getFeatureFlagActivity({ configId, featureFlagId }: GetFeatureFlagActivityInput) {
  return apiRequest<AuditLog[]>(`/configs/${configId}/feature-flags/${featureFlagId}/activity`);
}

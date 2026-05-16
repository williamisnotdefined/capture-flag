import { apiRequest } from "@api/client";
import type { AuditLogListResponse } from "@src/types";

type GetFeatureFlagActivityInput = {
  configId: string;
  cursor?: string | null;
  featureFlagId: string;
  limit?: number;
};

export function getFeatureFlagActivity({
  configId,
  cursor,
  featureFlagId,
  limit,
}: GetFeatureFlagActivityInput) {
  const searchParams = new URLSearchParams();

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  if (limit !== undefined) {
    searchParams.set("limit", String(limit));
  }

  const queryString = searchParams.toString();

  return apiRequest<AuditLogListResponse>(
    `/configs/${configId}/feature-flags/${featureFlagId}/activity${queryString ? `?${queryString}` : ""}`,
  );
}

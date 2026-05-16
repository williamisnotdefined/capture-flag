import { apiRequest } from "@api/client";
import type { Segment } from "@src/types";

export function getConfigSegments(configId: string) {
  return apiRequest<Segment[]>(`/configs/${configId}/segments`);
}

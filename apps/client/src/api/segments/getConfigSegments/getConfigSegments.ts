import type { Segment } from "../../../types";
import { apiRequest } from "../../client";

export function getConfigSegments(configId: string) {
  return apiRequest<Segment[]>(`/configs/${configId}/segments`);
}

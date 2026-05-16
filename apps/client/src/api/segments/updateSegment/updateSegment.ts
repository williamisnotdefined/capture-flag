import { patchJson } from "@api/client";
import type { Segment } from "@src/types";

export type UpdateSegmentValues = {
  conditionsJson?: unknown[];
  description?: string;
  key?: string;
  name?: string;
};

type UpdateSegmentInput = UpdateSegmentValues & {
  configId: string;
  segmentId: string;
};

export function updateSegment({ configId, segmentId, ...values }: UpdateSegmentInput) {
  return patchJson<Segment>(`/configs/${configId}/segments/${segmentId}`, values);
}

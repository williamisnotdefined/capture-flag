import { postJson } from "@api/client";
import type { Segment } from "@src/types";

export type CreateSegmentValues = {
  conditionsJson?: unknown[];
  description?: string;
  key: string;
  name: string;
};

type CreateSegmentInput = CreateSegmentValues & {
  configId: string;
};

export function createSegment({ configId, ...values }: CreateSegmentInput) {
  return postJson<Segment>(`/configs/${configId}/segments`, values);
}

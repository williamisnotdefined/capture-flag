import type { Segment } from "../../../types";
import { postJson } from "../../client";

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

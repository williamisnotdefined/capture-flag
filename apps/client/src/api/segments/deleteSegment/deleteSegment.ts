import { deleteJson } from "../../client";

type DeleteSegmentInput = {
  configId: string;
  segmentId: string;
};

export function deleteSegment({ configId, segmentId }: DeleteSegmentInput) {
  return deleteJson<{ ok: true }>(`/configs/${configId}/segments/${segmentId}`);
}

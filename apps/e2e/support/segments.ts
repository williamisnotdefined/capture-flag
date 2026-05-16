import type { APIRequestContext } from "@playwright/test";
import { apiDeleteJson, apiGetJson, apiPatchJson, apiPostJson } from "./api";
import type { OkResponse } from "./feature-flags";

export type SegmentCondition = {
  attribute: string;
  operator: string;
  value: unknown;
};

export type Segment = {
  conditionsJson: SegmentCondition[];
  deletedAt: string | null;
  description: string | null;
  id: string;
  key: string;
  name: string;
};

export async function listSegmentsViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
) {
  return apiGetJson<Segment[]>(request, `/api/v1/configs/${configId}/segments`, sessionToken);
}

export async function createSegmentViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  input: {
    conditionsJson?: unknown;
    description?: string;
    key: string;
    name: string;
  },
) {
  return apiPostJson<Segment>(request, `/api/v1/configs/${configId}/segments`, sessionToken, input);
}

export async function updateSegmentViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  segmentId: string,
  input: {
    conditionsJson?: unknown;
    description?: string;
    key?: string;
    name?: string;
  },
) {
  return apiPatchJson<Segment>(
    request,
    `/api/v1/configs/${configId}/segments/${segmentId}`,
    sessionToken,
    input,
  );
}

export async function deleteSegmentViaApi(
  request: APIRequestContext,
  sessionToken: string,
  configId: string,
  segmentId: string,
) {
  return apiDeleteJson<OkResponse>(
    request,
    `/api/v1/configs/${configId}/segments/${segmentId}`,
    sessionToken,
  );
}

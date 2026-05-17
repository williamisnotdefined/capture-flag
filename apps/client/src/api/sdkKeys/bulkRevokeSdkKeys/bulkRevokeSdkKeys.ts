import { postJson } from "@api/client";

export type BulkRevokeSdkKeysInput = {
  projectId: string;
  sdkKeyIds: string[];
};

export function bulkRevokeSdkKeys({ projectId, sdkKeyIds }: BulkRevokeSdkKeysInput) {
  return postJson<{ count: number; ok: true }>(`/projects/${projectId}/sdk-keys/bulk-revoke`, {
    ids: sdkKeyIds,
  });
}

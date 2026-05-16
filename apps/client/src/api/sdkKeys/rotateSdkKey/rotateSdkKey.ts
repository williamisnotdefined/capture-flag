import { postJson } from "@api/client";
import type { SdkKey } from "@src/types";

export function rotateSdkKey(sdkKeyId: string) {
  return postJson<SdkKey>(`/sdk-keys/${sdkKeyId}/rotate`, {});
}

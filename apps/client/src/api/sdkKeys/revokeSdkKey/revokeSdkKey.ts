import { postJson } from "@api/client";
import type { SdkKey } from "@src/types";

export function revokeSdkKey(sdkKeyId: string) {
  return postJson<SdkKey>(`/sdk-keys/${sdkKeyId}/revoke`, {});
}

import type { SdkKey } from "../../../types";
import { postJson } from "../../client";

export function revokeSdkKey(sdkKeyId: string) {
  return postJson<SdkKey>(`/sdk-keys/${sdkKeyId}/revoke`, {});
}

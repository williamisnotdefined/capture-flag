import type { SdkKey } from "../../../types";
import { postJson } from "../../client";

export function rotateSdkKey(sdkKeyId: string) {
  return postJson<SdkKey>(`/sdk-keys/${sdkKeyId}/rotate`, {});
}

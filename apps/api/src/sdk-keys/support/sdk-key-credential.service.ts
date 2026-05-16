import { Injectable } from "@nestjs/common";
import { createRawSdkKey, hashSdkKey } from "../../common/sdk-key-crypto";

export type SdkKeyCredential = {
  keyHash: string;
  keyPrefix: string;
  rawKey: string;
};

@Injectable()
export class SdkKeyCredentialService {
  createCredential(): SdkKeyCredential {
    const rawKey = createRawSdkKey();

    return {
      keyHash: hashSdkKey(rawKey),
      keyPrefix: rawKey.slice(0, 18),
      rawKey,
    };
  }
}

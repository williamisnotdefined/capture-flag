import { Injectable } from "@nestjs/common";
import { createRawApiToken, hashApiToken } from "../../common/api-token-crypto";

export type ApiTokenCredential = {
  rawToken: string;
  tokenHash: string;
  tokenPrefix: string;
};

@Injectable()
export class ApiTokenCredentialService {
  createCredential(): ApiTokenCredential {
    const rawToken = createRawApiToken();

    return {
      rawToken,
      tokenHash: hashApiToken(rawToken),
      tokenPrefix: rawToken.slice(0, 18),
    };
  }
}

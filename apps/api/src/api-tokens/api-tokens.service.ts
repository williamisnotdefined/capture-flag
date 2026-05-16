import { Injectable } from "@nestjs/common";
import {
  AuthenticateApiTokenService,
  CreateApiTokenService,
  ListApiTokensService,
  RevokeApiTokenService,
} from "./use-cases";

type CreateApiTokenInput = {
  expiresAt?: string;
  name?: string;
  projectId?: string;
  scopes?: string[];
};

@Injectable()
export class ApiTokensService {
  constructor(
    private readonly listApiTokens: ListApiTokensService,
    private readonly createApiToken: CreateApiTokenService,
    private readonly revokeApiToken: RevokeApiTokenService,
    private readonly authenticateApiToken: AuthenticateApiTokenService,
  ) {}

  list(userId: string, organizationId: string) {
    return this.listApiTokens.execute({ userId, organizationId });
  }

  create(userId: string, organizationId: string, input: CreateApiTokenInput) {
    return this.createApiToken.execute({ userId, organizationId, input });
  }

  revoke(userId: string, apiTokenId: string) {
    return this.revokeApiToken.execute({ userId, apiTokenId });
  }

  authenticate(rawToken: string) {
    return this.authenticateApiToken.execute({ rawToken });
  }
}

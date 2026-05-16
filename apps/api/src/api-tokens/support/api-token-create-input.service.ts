import { BadRequestException, Injectable } from "@nestjs/common";
import { isApiTokenScope } from "../../common/api-token-scopes";
import { ApiTokenAccessService } from "./api-token-access.service";

export type NormalizedCreateApiTokenInput = {
  expiresAt: Date | null;
  name: string;
  projectId: string | null;
  scopes: string[];
};

type CreateApiTokenInput = {
  expiresAt?: string;
  name?: string;
  projectId?: string;
  scopes?: string[];
};

@Injectable()
export class ApiTokenCreateInputService {
  constructor(private readonly apiTokenAccess: ApiTokenAccessService) {}

  async normalize(
    organizationId: string,
    input: CreateApiTokenInput,
  ): Promise<NormalizedCreateApiTokenInput> {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("API token name is required");
    }

    const scopes = this.normalizeScopes(input.scopes);
    const expiresAt = this.normalizeExpiresAt(input.expiresAt);
    const projectId = await this.apiTokenAccess.normalizeProjectId(organizationId, input.projectId);

    return { expiresAt, name, projectId, scopes };
  }

  private normalizeScopes(scopes: string[] | undefined) {
    const normalizedScopes = [...new Set((scopes ?? []).map((scope) => scope.trim()))];
    if (normalizedScopes.length === 0) {
      throw new BadRequestException("At least one API token scope is required");
    }

    for (const scope of normalizedScopes) {
      if (!isApiTokenScope(scope)) {
        throw new BadRequestException("API token scope is invalid");
      }
    }

    return normalizedScopes;
  }

  private normalizeExpiresAt(value: string | undefined) {
    if (!value) {
      return null;
    }

    const expiresAt = new Date(value);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("API token expiration is invalid");
    }

    if (expiresAt <= new Date()) {
      throw new BadRequestException("API token expiration must be in the future");
    }

    return expiresAt;
  }
}

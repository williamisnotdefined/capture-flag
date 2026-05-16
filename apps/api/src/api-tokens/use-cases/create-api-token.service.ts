import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ApiTokenAccessService,
  ApiTokenAuditService,
  ApiTokenCreateInputService,
  ApiTokenCredentialService,
  apiTokenSelect,
} from "../support";

export type CreateApiTokenInput = {
  input: {
    expiresAt?: string;
    name?: string;
    projectId?: string;
    scopes?: string[];
  };
  organizationId: string;
  userId: string;
};

@Injectable()
export class CreateApiTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiTokenAccess: ApiTokenAccessService,
    private readonly apiTokenAudit: ApiTokenAuditService,
    private readonly apiTokenCreateInput: ApiTokenCreateInputService,
    private readonly apiTokenCredential: ApiTokenCredentialService,
  ) {}

  async execute({ userId, organizationId, input }: CreateApiTokenInput) {
    await this.apiTokenAccess.requireOrganizationWrite(userId, organizationId);

    const normalizedInput = await this.apiTokenCreateInput.normalize(organizationId, input);
    const credential = this.apiTokenCredential.createCredential();

    return this.prisma.$transaction(async (tx) => {
      const apiToken = await tx.apiToken.create({
        data: {
          organizationId,
          projectId: normalizedInput.projectId,
          userId,
          name: normalizedInput.name,
          tokenPrefix: credential.tokenPrefix,
          tokenHash: credential.tokenHash,
          scopes: normalizedInput.scopes,
          expiresAt: normalizedInput.expiresAt,
        },
        select: apiTokenSelect(),
      });

      await this.apiTokenAudit.writeApiTokenCreated(tx, {
        actorUserId: userId,
        apiToken,
      });

      return {
        ...apiToken,
        token: credential.rawToken,
      };
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  SdkKeyAccessService,
  SdkKeyAuditService,
  SdkKeyCredentialService,
  sdkKeySelect,
} from "../support";

export type CreateSdkKeyInput = {
  input: {
    configId?: string;
    environmentId?: string;
    name?: string;
  };
  projectId: string;
  userId: string;
};

@Injectable()
export class CreateSdkKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkKeyAccess: SdkKeyAccessService,
    private readonly sdkKeyAudit: SdkKeyAuditService,
    private readonly sdkKeyCredential: SdkKeyCredentialService,
  ) {}

  async execute({ userId, projectId, input }: CreateSdkKeyInput) {
    const { access, config, environment } =
      await this.sdkKeyAccess.findConfigAndEnvironmentForCreate(userId, projectId, input);

    const credential = this.sdkKeyCredential.createCredential();

    return this.prisma.$transaction(async (tx) => {
      const sdkKey = await tx.sdkKey.create({
        data: {
          projectId,
          configId: config.id,
          environmentId: environment.id,
          name: input.name?.trim() || `${config.name} ${environment.name} SDK Key`,
          keyPrefix: credential.keyPrefix,
          keyHash: credential.keyHash,
        },
        select: sdkKeySelect(),
      });

      await this.sdkKeyAudit.writeSdkKeyCreated(tx, {
        actorUserId: userId,
        organizationId: access.project.organizationId,
        sdkKey,
      });

      return {
        ...sdkKey,
        key: credential.rawKey,
      };
    });
  }
}

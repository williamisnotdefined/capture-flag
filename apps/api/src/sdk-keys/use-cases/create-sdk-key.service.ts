import { Injectable } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { createRawSdkKey, hashSdkKey } from "../../common/sdk-key-crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { SdkKeyAccessService, SdkKeyAuditService, sdkKeySelect } from "../support";

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
  ) {}

  async execute({ userId, projectId, input }: CreateSdkKeyInput) {
    const { access, config, environment } =
      await this.sdkKeyAccess.findConfigAndEnvironmentForCreate(userId, projectId, input);

    const rawKey = createRawSdkKey();
    const keyPrefix = rawKey.slice(0, 18);
    const keyHash = hashSdkKey(rawKey);

    return this.prisma.$transaction(async (tx) => {
      const sdkKey = await tx.sdkKey.create({
        data: {
          projectId,
          configId: config.id,
          environmentId: environment.id,
          name: input.name?.trim() || `${config.name} ${environment.name} SDK Key`,
          keyPrefix,
          keyHash,
        },
        select: sdkKeySelect(),
      });

      await createAuditLog(tx, {
        action: "sdk_key.created",
        actorUserId: userId,
        configId: config.id,
        entityId: sdkKey.id,
        entityType: "sdk_key",
        metadata: toAuditJson({ environmentId: environment.id, keyPrefix }),
        newValue: this.sdkKeyAudit.sdkKeyAuditValue(sdkKey),
        organizationId: access.project.organizationId,
        projectId,
      });

      return {
        ...sdkKey,
        key: rawKey,
      };
    });
  }
}

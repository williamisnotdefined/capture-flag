import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { hashSdkKey } from "../common/sdk-key-crypto";
import type { PublicSdkKeyConfig } from "./public-config.types";

@Injectable()
export class SdkKeyConfigAuthService {
  async findActiveSdkKey(
    tx: Prisma.TransactionClient,
    rawSdkKey: string,
  ): Promise<PublicSdkKeyConfig> {
    const sdkKey = await tx.sdkKey.findUnique({
      where: { keyHash: hashSdkKey(rawSdkKey) },
      select: {
        id: true,
        configId: true,
        environmentId: true,
        revokedAt: true,
        project: {
          select: {
            id: true,
            slug: true,
          },
        },
        config: {
          select: {
            id: true,
            key: true,
          },
        },
        environment: {
          select: {
            id: true,
            key: true,
          },
        },
      },
    });

    if (!sdkKey || sdkKey.revokedAt) {
      throw new NotFoundException("SDK key not found");
    }

    return sdkKey;
  }
}

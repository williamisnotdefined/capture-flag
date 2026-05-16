import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SdkKeyUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async recordUse(sdkKeyId: string) {
    try {
      await this.prisma.sdkKey.updateMany({
        where: {
          id: sdkKeyId,
          revokedAt: null,
        },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      return;
    }
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SdkKeyAccessService, sdkKeySelect } from "../support";

export type ListSdkKeysInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class ListSdkKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkKeyAccess: SdkKeyAccessService,
  ) {}

  async execute({ userId, projectId }: ListSdkKeysInput) {
    await this.sdkKeyAccess.requireProjectRead(userId, projectId);

    return this.prisma.sdkKey.findMany({
      where: { projectId },
      select: sdkKeySelect(),
      orderBy: { createdAt: "desc" },
    });
  }
}

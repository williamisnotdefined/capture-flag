import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ApiTokenAccessService, apiTokenSelect } from "../support";

export type ListApiTokensInput = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class ListApiTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiTokenAccess: ApiTokenAccessService,
  ) {}

  async execute({ userId, organizationId }: ListApiTokensInput) {
    await this.apiTokenAccess.requireOrganizationWrite(userId, organizationId);

    return this.prisma.apiToken.findMany({
      where: { organizationId },
      select: apiTokenSelect(),
      orderBy: { createdAt: "desc" },
    });
  }
}

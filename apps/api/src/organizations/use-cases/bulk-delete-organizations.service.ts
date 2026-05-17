import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { PrismaService } from "../../prisma/prisma.service";

export type BulkDeleteOrganizationsInput = {
  organizationIds: string[];
  userId: string;
};

@Injectable()
export class BulkDeleteOrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, organizationIds }: BulkDeleteOrganizationsInput) {
    for (const organizationId of organizationIds) {
      await this.access.requireOrganizationRole(userId, organizationId, ["owner"]);
    }

    const deletedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.organization.updateMany({
        where: { id: { in: organizationIds }, deletedAt: null },
        data: { deletedAt },
      });

      if (result.count !== organizationIds.length) {
        throw new NotFoundException("Organization not found");
      }
    });

    return { ok: true, count: organizationIds.length };
  }
}

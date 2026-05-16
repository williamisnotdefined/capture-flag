import { Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { PrismaService } from "../../prisma/prisma.service";

export type DeleteOrganizationInput = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class DeleteOrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, organizationId }: DeleteOrganizationInput) {
    await this.access.requireOrganizationRole(userId, organizationId, ["owner"]);

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationMemberAccessService, organizationMemberInclude } from "../support";

export type ListOrganizationMembersInput = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class ListOrganizationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationMemberAccess: OrganizationMemberAccessService,
  ) {}

  async execute({ userId, organizationId }: ListOrganizationMembersInput) {
    await this.organizationMemberAccess.requireOrganizationMember(userId, organizationId);

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: organizationMemberInclude(),
      orderBy: { createdAt: "asc" },
    });
  }
}

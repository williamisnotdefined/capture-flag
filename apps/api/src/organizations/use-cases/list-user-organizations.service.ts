import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { userOrganizationMembershipSelect } from "../support";

export type ListUserOrganizationsInput = {
  userId: string;
};

@Injectable()
export class ListUserOrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ userId }: ListUserOrganizationsInput) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId,
        organization: {
          deletedAt: null,
        },
      },
      select: userOrganizationMembershipSelect(),
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((membership) => {
      const { _count, ...organization } = membership.organization;

      return {
        ...organization,
        role: membership.role,
        memberCount: _count?.members ?? 0,
        projectCount: _count?.projects ?? 0,
      };
    });
  }
}

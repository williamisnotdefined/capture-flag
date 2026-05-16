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
      where: { userId },
      select: userOrganizationMembershipSelect(),
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      createdAt: membership.organization.createdAt,
    }));
  }
}

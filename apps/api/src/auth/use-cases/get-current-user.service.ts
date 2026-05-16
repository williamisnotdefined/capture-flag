import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/authenticated-request";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GetCurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(user: AuthenticatedUser) {
    const organizations = await this.prisma.organizationMember.findMany({
      where: {
        userId: user.id,
      },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      user,
      organizations: organizations.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      })),
    };
  }
}

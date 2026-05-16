import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/authenticated-request";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GetCurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(user: AuthenticatedUser) {
    const organizations = await this.prisma.organizationMember.findMany({
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                members: true,
                projects: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        userId: user.id,
        organization: {
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      user,
      organizations: organizations.map((membership) => {
        const { _count, ...organization } = membership.organization;

        return {
          ...organization,
          role: membership.role,
          memberCount: _count?.members ?? 0,
          projectCount: _count?.projects ?? 0,
        };
      }),
    };
  }
}

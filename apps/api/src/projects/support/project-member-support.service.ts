import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProjectMemberSupportService {
  constructor(private readonly prisma: PrismaService) {}

  async findTargetUser(input: { userId?: string; email?: string }) {
    const userId = input.userId?.trim();
    const email = input.email?.trim().toLowerCase();

    if (userId && email) {
      throw new BadRequestException("Provide exactly one of userId or email");
    }

    if (userId) {
      return this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (email) {
      return this.prisma.user.findUnique({ where: { email } });
    }

    throw new BadRequestException("userId or email is required");
  }

  projectMemberInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    } as const;
  }
}

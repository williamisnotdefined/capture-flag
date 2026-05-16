import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrganizationMemberTargetService {
  constructor(private readonly prisma: PrismaService) {}

  async findTargetUser(input: { userId?: string; email?: string }) {
    const userId = input.userId?.trim();
    const email = input.email?.trim().toLowerCase();

    if (userId && email) {
      throw new BadRequestException("Provide exactly one of userId or email");
    }

    if (userId) {
      return this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
    }

    if (email) {
      return this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
    }

    throw new BadRequestException("userId or email is required");
  }
}

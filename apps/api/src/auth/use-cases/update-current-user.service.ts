import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export type UpdateCurrentUserInput = {
  name: string;
  userId: string;
};

@Injectable()
export class UpdateCurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  execute({ userId, name }: UpdateCurrentUserInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        email: true,
        id: true,
        name: true,
      },
    });
  }
}

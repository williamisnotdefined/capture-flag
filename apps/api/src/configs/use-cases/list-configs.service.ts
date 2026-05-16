import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigAccessService } from "../support";

export type ListConfigsInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class ListConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configAccess: ConfigAccessService,
  ) {}

  async execute({ userId, projectId }: ListConfigsInput) {
    await this.configAccess.requireProjectAccess(userId, projectId);

    return this.prisma.config.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EnvironmentAccessService } from "../support";

export type ListEnvironmentsInput = {
  projectId: string;
  userId: string;
};

@Injectable()
export class ListEnvironmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentAccess: EnvironmentAccessService,
  ) {}

  async execute({ userId, projectId }: ListEnvironmentsInput) {
    await this.environmentAccess.requireProjectAccess(userId, projectId);

    return this.prisma.environment.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
    });
  }
}

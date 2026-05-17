import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EnvironmentAccessService } from "../support";

export type BulkDeleteEnvironmentsInput = {
  environmentIds: string[];
  projectId: string;
  userId: string;
};

@Injectable()
export class BulkDeleteEnvironmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentAccess: EnvironmentAccessService,
  ) {}

  async execute({ userId, projectId, environmentIds }: BulkDeleteEnvironmentsInput) {
    await this.environmentAccess.requireProjectManager(userId, projectId);

    const environments = await this.prisma.environment.findMany({
      where: { id: { in: environmentIds }, projectId },
      select: { id: true },
    });

    if (environments.length !== environmentIds.length) {
      throw new NotFoundException("Environment not found");
    }

    await this.prisma.$transaction(async (tx) => {
      const deleteResult = await tx.environment.deleteMany({
        where: { id: { in: environmentIds }, projectId },
      });

      if (deleteResult.count !== environmentIds.length) {
        throw new NotFoundException("Environment not found");
      }
    });

    return { ok: true, count: environmentIds.length };
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EnvironmentAccessService } from "../support";

export type DeleteEnvironmentInput = {
  environmentId: string;
  userId: string;
};

@Injectable()
export class DeleteEnvironmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentAccess: EnvironmentAccessService,
  ) {}

  async execute({ userId, environmentId }: DeleteEnvironmentInput) {
    await this.environmentAccess.findEnvironmentForUpdate(userId, environmentId);
    await this.prisma.environment.delete({ where: { id: environmentId } });

    return { ok: true };
  }
}

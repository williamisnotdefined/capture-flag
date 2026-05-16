import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SegmentAccessService } from "../support";

export type ListSegmentsInput = {
  configId: string;
  userId: string;
};

@Injectable()
export class ListSegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentAccess: SegmentAccessService,
  ) {}

  async execute({ userId, configId }: ListSegmentsInput) {
    await this.segmentAccess.findConfigForRead(userId, configId);

    return this.prisma.segment.findMany({
      where: {
        configId,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
  }
}

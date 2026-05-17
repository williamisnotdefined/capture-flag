import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { FeatureFlagAccessService } from "../support";

export type ListFeatureFlagActivityInput = {
  configId: string;
  featureFlagId: string;
  query?: {
    cursor?: string;
    limit?: number;
  };
  userId: string;
};

@Injectable()
export class ListFeatureFlagActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagAccess: FeatureFlagAccessService,
  ) {}

  async execute({ userId, configId, featureFlagId, query = {} }: ListFeatureFlagActivityInput) {
    await this.featureFlagAccess.findConfigForRead(userId, configId);
    const flag = await this.featureFlagAccess.findActiveFlag(configId, featureFlagId);
    const limit = query.limit ?? 50;
    const cursor = query.cursor ? this.decodeActivityCursor(query.cursor) : null;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        configId,
        projectId: flag.projectId,
        OR: [
          {
            entityId: featureFlagId,
            entityType: "feature_flag",
          },
          {
            entityType: "feature_flag_environment_value",
            metadata: {
              path: ["featureFlagId"],
              equals: featureFlagId,
            },
          },
        ],
        ...(cursor
          ? {
              AND: [
                {
                  OR: [
                    { createdAt: { lt: new Date(cursor.createdAt) } },
                    { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
                  ],
                },
              ],
            }
          : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const items = logs.slice(0, limit);
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor: logs.length > limit && lastItem ? this.encodeActivityCursor(lastItem) : null,
    };
  }

  private encodeActivityCursor(log: { createdAt: Date; id: string }) {
    return Buffer.from(
      JSON.stringify({
        createdAt: log.createdAt.toISOString(),
        id: log.id,
      }),
      "utf8",
    ).toString("base64url");
  }

  private decodeActivityCursor(value: string) {
    try {
      const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<{
        createdAt: string;
        id: string;
      }>;

      if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
        throw new Error("Invalid feature flag activity cursor");
      }

      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error("Invalid feature flag activity cursor");
      }

      return { createdAt: createdAt.toISOString(), id: parsed.id };
    } catch {
      throw new BadRequestException("Invalid feature flag activity cursor");
    }
  }
}

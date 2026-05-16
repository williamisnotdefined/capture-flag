import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { type FeatureFlagType, isFeatureFlagType } from "../../common/flag-values";
import type { FeatureFlagPrerequisiteGraphFlag } from "./feature-flag-prerequisite-graph.service";

export type FeatureFlagRuleContextClient = Pick<
  Prisma.TransactionClient,
  "featureFlag" | "segment"
>;

export type FeatureFlagRuleContext = {
  activeFlagTypes: ReadonlyMap<string, FeatureFlagType>;
  flagsForPrerequisiteGraph: FeatureFlagPrerequisiteGraphFlag[];
  segmentKeys: ReadonlySet<string>;
};

@Injectable()
export class FeatureFlagRuleContextService {
  async load(
    client: FeatureFlagRuleContextClient,
    configId: string,
    environmentId: string,
  ): Promise<FeatureFlagRuleContext> {
    const [segments, flags] = await Promise.all([
      client.segment.findMany({
        where: {
          configId,
          deletedAt: null,
        },
        select: { key: true },
      }),
      client.featureFlag.findMany({
        where: {
          configId,
          deletedAt: null,
        },
        select: {
          key: true,
          type: true,
          environmentValues: {
            where: { environmentId },
            select: { rulesJson: true },
            take: 1,
          },
        },
      }),
    ]);

    const activeFlagTypes = new Map<string, FeatureFlagType>();
    for (const activeFlag of flags) {
      if (isFeatureFlagType(activeFlag.type)) {
        activeFlagTypes.set(activeFlag.key, activeFlag.type);
      }
    }

    return {
      activeFlagTypes,
      flagsForPrerequisiteGraph: flags,
      segmentKeys: new Set(segments.map((segment) => segment.key)),
    };
  }
}

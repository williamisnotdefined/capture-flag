import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { rulesJsonReferencesSegment } from "../../common/flag-values";

type SegmentReferenceClient = Pick<Prisma.TransactionClient, "featureFlagEnvironmentValue">;

@Injectable()
export class SegmentReferenceService {
  async ensureSegmentIsNotReferenced(
    client: SegmentReferenceClient,
    configId: string,
    segmentKey: string,
    action: "delete" | "rename",
  ) {
    const values = await client.featureFlagEnvironmentValue.findMany({
      where: {
        configId,
        featureFlag: {
          deletedAt: null,
        },
      },
      select: {
        environment: {
          select: {
            key: true,
          },
        },
        featureFlag: {
          select: {
            key: true,
          },
        },
        rulesJson: true,
      },
    });

    const references = values.filter((value) =>
      rulesJsonReferencesSegment(value.rulesJson, segmentKey),
    );
    if (references.length === 0) {
      return;
    }

    const firstReference = references[0];
    throw new BadRequestException(
      `Cannot ${action} segment while it is referenced by ${firstReference.featureFlag.key} in ${firstReference.environment.key}`,
    );
  }
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { rulesJsonReferencesPrerequisiteFlag } from "../../common/flag-values";

type FlagReferenceClient = Pick<Prisma.TransactionClient, "featureFlagEnvironmentValue">;

@Injectable()
export class FeatureFlagReferenceService {
  async ensureFlagIsNotReferenced(
    client: FlagReferenceClient,
    configId: string,
    flagKey: string,
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
      rulesJsonReferencesPrerequisiteFlag(value.rulesJson, flagKey),
    );
    if (references.length === 0) {
      return;
    }

    const firstReference = references[0];
    throw new BadRequestException(
      `Cannot ${action} flag while it is referenced as prerequisite by ${firstReference.featureFlag.key} in ${firstReference.environment.key}`,
    );
  }
}

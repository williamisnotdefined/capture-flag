import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  FeatureFlagPublicValueService,
  type PublicEnvironmentValueUpdate,
} from "./feature-flag-public-value.service";

const featureFlagEnvironmentValueInclude = {
  environment: {
    select: {
      id: true,
      key: true,
      name: true,
      sortOrder: true,
    },
  },
} as const;

export type FeatureFlagEnvironmentValueWithEnvironment =
  Prisma.FeatureFlagEnvironmentValueGetPayload<{
    include: typeof featureFlagEnvironmentValueInclude;
  }>;

export type FeatureFlagEnvironmentValueWriteResult = {
  didChange: boolean;
  existingValue: FeatureFlagEnvironmentValueWithEnvironment | null;
  value: FeatureFlagEnvironmentValueWithEnvironment;
};

type FeatureFlagEnvironmentValueWriteClient = Pick<
  Prisma.TransactionClient,
  "featureFlagEnvironmentValue"
>;

@Injectable()
export class FeatureFlagEnvironmentValueWriterService {
  constructor(private readonly featureFlagPublicValue: FeatureFlagPublicValueService) {}

  async write(
    client: FeatureFlagEnvironmentValueWriteClient,
    {
      createData,
      environmentId,
      featureFlagId,
      publicUpdate,
      updateData,
    }: {
      createData: Prisma.FeatureFlagEnvironmentValueUncheckedCreateInput;
      environmentId: string;
      featureFlagId: string;
      publicUpdate: PublicEnvironmentValueUpdate;
      updateData: Prisma.FeatureFlagEnvironmentValueUncheckedUpdateInput;
    },
  ): Promise<FeatureFlagEnvironmentValueWriteResult> {
    const where = {
      featureFlagId_environmentId: {
        featureFlagId,
        environmentId,
      },
    };
    const existingValue = await client.featureFlagEnvironmentValue.findUnique({
      where,
      include: featureFlagEnvironmentValueInclude,
    });

    if (
      existingValue &&
      !this.featureFlagPublicValue.hasPublicValueChange(existingValue, publicUpdate)
    ) {
      return {
        didChange: false,
        existingValue,
        value: existingValue,
      };
    }

    const value = await client.featureFlagEnvironmentValue.upsert({
      where,
      create: createData,
      update: updateData,
      include: featureFlagEnvironmentValueInclude,
    });

    return {
      didChange: true,
      existingValue,
      value,
    };
  }
}

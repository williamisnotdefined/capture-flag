import { Injectable } from "@nestjs/common";
import {
  CreateFeatureFlagService,
  DeleteFeatureFlagService,
  ListFeatureFlagActivityService,
  ListFeatureFlagsService,
  UpdateFeatureFlagEnvironmentValueService,
  UpdateFeatureFlagService,
} from "./use-cases";

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly listFeatureFlags: ListFeatureFlagsService,
    private readonly createFeatureFlag: CreateFeatureFlagService,
    private readonly updateFeatureFlag: UpdateFeatureFlagService,
    private readonly deleteFeatureFlag: DeleteFeatureFlagService,
    private readonly listFeatureFlagActivity: ListFeatureFlagActivityService,
    private readonly updateFeatureFlagEnvironmentValue: UpdateFeatureFlagEnvironmentValueService,
  ) {}

  list(userId: string, configId: string) {
    return this.listFeatureFlags.execute({ userId, configId });
  }

  create(
    userId: string,
    configId: string,
    input: {
      key?: string;
      name?: string;
      description?: string;
      type?: string;
      defaultValue?: unknown;
      tags?: unknown;
      hint?: string;
      ownerUserId?: string | null;
    },
  ) {
    return this.createFeatureFlag.execute({ userId, configId, input });
  }

  update(
    userId: string,
    configId: string,
    featureFlagId: string,
    input: {
      key?: string;
      name?: string;
      description?: string;
      tags?: unknown;
      hint?: string;
      ownerUserId?: string | null;
    },
  ) {
    return this.updateFeatureFlag.execute({ userId, configId, featureFlagId, input });
  }

  delete(userId: string, configId: string, featureFlagId: string) {
    return this.deleteFeatureFlag.execute({ userId, configId, featureFlagId });
  }

  listActivity(
    userId: string,
    configId: string,
    featureFlagId: string,
    query: { cursor?: string; limit?: number } = {},
  ) {
    return this.listFeatureFlagActivity.execute({ userId, configId, featureFlagId, query });
  }

  updateEnvironmentValue(
    userId: string,
    configId: string,
    featureFlagId: string,
    environmentId: string,
    input: {
      defaultValue?: unknown;
      rulesJson?: unknown;
      percentageAttribute?: string;
      percentageOptionsJson?: unknown;
    },
  ) {
    return this.updateFeatureFlagEnvironmentValue.execute({
      userId,
      configId,
      featureFlagId,
      environmentId,
      input,
    });
  }
}

import { Injectable } from "@nestjs/common";
import { type FeatureFlagType, normalizeJsonArray, normalizeRules } from "../../common/flag-values";
import { FeatureFlagPrerequisiteGraphService } from "./feature-flag-prerequisite-graph.service";
import {
  type FeatureFlagRuleContextClient,
  FeatureFlagRuleContextService,
} from "./feature-flag-rule-context.service";

@Injectable()
export class FeatureFlagRulesService {
  constructor(
    private readonly featureFlagRuleContext: FeatureFlagRuleContextService,
    private readonly featureFlagPrerequisiteGraph: FeatureFlagPrerequisiteGraphService,
  ) {}

  async normalizeRulesJson(
    client: FeatureFlagRuleContextClient,
    flag: { configId: string; key: string },
    environmentId: string,
    type: FeatureFlagType,
    value: unknown,
  ) {
    const rawRules = normalizeJsonArray(value, "rulesJson");
    if (rawRules.length === 0) {
      return rawRules;
    }

    const context = await this.featureFlagRuleContext.load(client, flag.configId, environmentId);

    const rules = normalizeRules(
      type,
      rawRules,
      context.segmentKeys,
      context.activeFlagTypes,
      flag.key,
    );

    this.featureFlagPrerequisiteGraph.ensurePrerequisiteGraphHasNoCycle(
      flag.key,
      rules,
      context.flagsForPrerequisiteGraph,
    );

    return rules;
  }
}

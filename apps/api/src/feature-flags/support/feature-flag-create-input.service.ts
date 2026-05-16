import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  defaultValueForFlagType,
  type FeatureFlagType,
  isFeatureFlagType,
  normalizeFlagDefaultValue,
  normalizeTags,
} from "../../common/flag-values";
import { FeatureFlagAccessService } from "./feature-flag-access.service";

export type FeatureFlagCreateInput = {
  defaultValue?: unknown;
  description?: string;
  hint?: string;
  key?: string;
  name?: string;
  ownerUserId?: string | null;
  tags?: unknown;
  type?: string;
};

export type NormalizedFeatureFlagCreateInput = {
  defaultValue: Prisma.InputJsonValue;
  description: string | null;
  hint: string | null;
  key: string;
  name: string;
  ownerUserId: string | null;
  tags: string[];
  type: FeatureFlagType;
};

@Injectable()
export class FeatureFlagCreateInputService {
  constructor(private readonly featureFlagAccess: FeatureFlagAccessService) {}

  async normalize({
    input,
    organizationId,
  }: {
    input: FeatureFlagCreateInput;
    organizationId: string;
  }): Promise<NormalizedFeatureFlagCreateInput> {
    const key = this.featureFlagAccess.normalizeFlagKey(input.key);
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Flag name is required");
    }

    if (!isFeatureFlagType(input.type)) {
      throw new BadRequestException("Valid flag type is required");
    }
    const type = input.type;
    const defaultValue = normalizeFlagDefaultValue(
      type,
      input.defaultValue === undefined ? defaultValueForFlagType(type) : input.defaultValue,
    ) as Prisma.InputJsonValue;
    const tags = normalizeTags(input.tags);
    const ownerUserId = await this.featureFlagAccess.normalizeOwnerUserId(
      input.ownerUserId,
      organizationId,
    );

    return {
      defaultValue,
      description: input.description?.trim() || null,
      hint: input.hint?.trim() || null,
      key,
      name,
      ownerUserId,
      tags,
      type,
    };
  }
}

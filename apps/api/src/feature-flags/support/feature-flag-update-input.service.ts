import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { normalizeTags } from "../../common/flag-values";
import { FeatureFlagAccessService } from "./feature-flag-access.service";

export type FeatureFlagUpdateInput = {
  description?: string;
  hint?: string;
  key?: string;
  name?: string;
  ownerUserId?: string | null;
  tags?: unknown;
};

export type NormalizedFeatureFlagUpdateInput = {
  changedFields: string[];
  data: Prisma.FeatureFlagUncheckedUpdateInput;
  publicChanged: boolean;
};

@Injectable()
export class FeatureFlagUpdateInputService {
  constructor(private readonly featureFlagAccess: FeatureFlagAccessService) {}

  async normalize({
    flag,
    input,
    organizationId,
  }: {
    flag: {
      description: string | null;
      hint: string | null;
      key: string;
      name: string;
      ownerUserId: string | null;
      tags: string[];
    };
    input: FeatureFlagUpdateInput;
    organizationId: string;
  }): Promise<NormalizedFeatureFlagUpdateInput> {
    const data: Prisma.FeatureFlagUncheckedUpdateInput = {};
    const changedFields: string[] = [];
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.featureFlagAccess.normalizeFlagKey(input.key);
      if (key !== flag.key) {
        data.key = key;
        changedFields.push("key");
      }
    }

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = input.name.trim();
      if (!name) {
        throw new BadRequestException("Flag name is required");
      }
      if (name !== flag.name) {
        data.name = name;
        changedFields.push("name");
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== flag.description) {
        data.description = description;
        changedFields.push("description");
      }
    }

    if (input.tags !== undefined) {
      receivedAnyField = true;
      const tags = normalizeTags(input.tags);
      if (JSON.stringify(tags) !== JSON.stringify(flag.tags)) {
        data.tags = tags;
        changedFields.push("tags");
      }
    }

    if (input.hint !== undefined) {
      receivedAnyField = true;
      const hint = input.hint.trim() || null;
      if (hint !== flag.hint) {
        data.hint = hint;
        changedFields.push("hint");
      }
    }

    if (input.ownerUserId !== undefined) {
      receivedAnyField = true;
      const ownerUserId = await this.featureFlagAccess.normalizeOwnerUserId(
        input.ownerUserId,
        organizationId,
      );
      if (ownerUserId !== flag.ownerUserId) {
        data.ownerUserId = ownerUserId;
        changedFields.push("ownerUserId");
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No feature flag fields to update");
    }

    return {
      changedFields,
      data,
      publicChanged: changedFields.includes("key"),
    };
  }
}

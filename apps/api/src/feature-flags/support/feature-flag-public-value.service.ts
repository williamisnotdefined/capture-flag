import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export type PublicEnvironmentValueUpdate = {
  defaultValue?: Prisma.InputJsonValue;
  rulesJson?: Prisma.InputJsonValue;
  percentageAttribute?: string;
  percentageOptionsJson?: Prisma.InputJsonValue;
};

@Injectable()
export class FeatureFlagPublicValueService {
  hasPublicValueChange(
    existingValue: {
      defaultValue: Prisma.JsonValue;
      rulesJson: Prisma.JsonValue;
      percentageAttribute: string;
      percentageOptionsJson: Prisma.JsonValue;
    },
    update: PublicEnvironmentValueUpdate,
  ) {
    if (
      update.defaultValue !== undefined &&
      !this.jsonValuesEqual(existingValue.defaultValue, update.defaultValue)
    ) {
      return true;
    }

    if (
      update.rulesJson !== undefined &&
      !this.jsonValuesEqual(existingValue.rulesJson, update.rulesJson)
    ) {
      return true;
    }

    if (
      update.percentageAttribute !== undefined &&
      existingValue.percentageAttribute !== update.percentageAttribute
    ) {
      return true;
    }

    if (
      update.percentageOptionsJson !== undefined &&
      !this.jsonValuesEqual(existingValue.percentageOptionsJson, update.percentageOptionsJson)
    ) {
      return true;
    }

    return false;
  }

  jsonValuesEqual(left: unknown, right: unknown): boolean {
    if (left === right) {
      return true;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
        return false;
      }

      return left.every((item, index) => this.jsonValuesEqual(item, right[index]));
    }

    if (this.isJsonObject(left) || this.isJsonObject(right)) {
      if (!this.isJsonObject(left) || !this.isJsonObject(right)) {
        return false;
      }

      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) {
        return false;
      }

      return leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) &&
          this.jsonValuesEqual(left[key], right[key]),
      );
    }

    return false;
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}

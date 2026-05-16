import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  isEvaluationOperator,
  maxSegmentConditions,
  normalizeConditionValue,
  normalizeJsonArray,
} from "../../common/flag-values";

const segmentKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

@Injectable()
export class SegmentValidationService {
  normalizeConditionsJson(value: unknown) {
    const conditions = normalizeJsonArray(value, "conditionsJson");
    if (conditions.length > maxSegmentConditions) {
      throw new BadRequestException(`Use at most ${maxSegmentConditions} segment conditions`);
    }

    return conditions.map((condition) =>
      this.normalizeCondition(condition),
    ) as Prisma.InputJsonValue;
  }

  normalizeSegmentKey(value: string | undefined) {
    const key = value?.trim();
    if (!key) {
      throw new BadRequestException("Segment key is required");
    }

    if (!segmentKeyPattern.test(key)) {
      throw new BadRequestException(
        "Segment key must start with a letter and contain only letters, numbers, dots, underscores or hyphens",
      );
    }

    return key;
  }

  normalizeSegmentName(value: string | undefined) {
    const name = value?.trim();
    if (!name) {
      throw new BadRequestException("Segment name is required");
    }

    return name;
  }

  jsonValuesEqual(left: Prisma.JsonValue, right: Prisma.InputJsonValue) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private normalizeCondition(condition: unknown) {
    if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
      throw new BadRequestException("Segment conditions must contain objects");
    }

    const record = condition as Record<string, unknown>;
    const attribute = typeof record.attribute === "string" ? record.attribute.trim() : "";
    if (!attribute) {
      throw new BadRequestException("Segment condition attribute is required");
    }

    if (attribute.length > 80) {
      throw new BadRequestException("Segment condition attribute is too long");
    }

    if (!isEvaluationOperator(record.operator)) {
      throw new BadRequestException("Segment condition operator is invalid");
    }

    if (!Object.prototype.hasOwnProperty.call(record, "value") || record.value === undefined) {
      throw new BadRequestException("Segment condition value is required");
    }

    if (Object.prototype.hasOwnProperty.call(record, "segment")) {
      throw new BadRequestException("Segments cannot reference other segments");
    }

    if (Object.prototype.hasOwnProperty.call(record, "prerequisiteFlag")) {
      throw new BadRequestException("Segments cannot reference prerequisite flags");
    }

    return {
      attribute,
      operator: record.operator,
      value: normalizeConditionValue(record.operator, record.value),
    };
  }
}

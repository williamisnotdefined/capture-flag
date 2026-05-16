import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { SegmentValidationService } from "./segment-validation.service";

export type SegmentUpdateInput = {
  conditionsJson?: unknown;
  description?: string;
  key?: string;
  name?: string;
};

export type NormalizedSegmentUpdateInput = {
  changedFields: string[];
  data: Prisma.SegmentUncheckedUpdateInput;
  publicChanged: boolean;
  publicUpdate: {
    conditionsJson?: Prisma.InputJsonValue;
    key?: string;
  };
};

@Injectable()
export class SegmentUpdateInputService {
  constructor(private readonly segmentValidation: SegmentValidationService) {}

  normalize({
    input,
    segment,
  }: {
    input: SegmentUpdateInput;
    segment: {
      conditionsJson: Prisma.JsonValue;
      description: string | null;
      key: string;
      name: string;
    };
  }): NormalizedSegmentUpdateInput {
    const data: Prisma.SegmentUncheckedUpdateInput = {};
    const publicUpdate: NormalizedSegmentUpdateInput["publicUpdate"] = {};
    const changedFields: string[] = [];
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.segmentValidation.normalizeSegmentKey(input.key);
      if (key !== segment.key) {
        data.key = key;
        publicUpdate.key = key;
        changedFields.push("key");
      }
    }

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = this.segmentValidation.normalizeSegmentName(input.name);
      if (name !== segment.name) {
        data.name = name;
        changedFields.push("name");
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== segment.description) {
        data.description = description;
        changedFields.push("description");
      }
    }

    if (input.conditionsJson !== undefined) {
      receivedAnyField = true;
      const conditionsJson = this.segmentValidation.normalizeConditionsJson(input.conditionsJson);
      if (!this.segmentValidation.jsonValuesEqual(segment.conditionsJson, conditionsJson)) {
        data.conditionsJson = conditionsJson;
        publicUpdate.conditionsJson = conditionsJson;
        changedFields.push("conditionsJson");
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No segment fields to update");
    }

    return {
      changedFields,
      data,
      publicChanged: publicUpdate.key !== undefined || publicUpdate.conditionsJson !== undefined,
      publicUpdate,
    };
  }
}

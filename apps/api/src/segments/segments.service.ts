import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AccessService } from "../common/access.service";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { bumpConfigEnvironmentState } from "../common/config-state";
import {
  isEvaluationOperator,
  normalizeConditionValue,
  normalizeJsonArray,
  rulesJsonReferencesSegment,
} from "../common/flag-values";
import { PrismaService } from "../prisma/prisma.service";

const segmentKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

type SegmentPublicUpdate = {
  conditionsJson?: Prisma.InputJsonValue;
  key?: string;
};

@Injectable()
export class SegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectAccess(userId, config.projectId);

    return this.prisma.segment.findMany({
      where: {
        configId,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(
    userId: string,
    configId: string,
    input: {
      conditionsJson?: unknown;
      description?: string;
      key?: string;
      name?: string;
    },
  ) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, ["project_admin", "developer"]);

    const key = this.normalizeSegmentKey(input.key);
    const name = this.normalizeSegmentName(input.name);
    const conditionsJson = this.normalizeConditionsJson(input.conditionsJson ?? []);

    return this.prisma.$transaction(async (tx) => {
      const segment = await tx.segment.create({
        data: {
          projectId: config.projectId,
          configId,
          key,
          name,
          description: input.description?.trim() || null,
          conditionsJson,
        },
      });

      const environmentIds = await this.bumpConfigEnvironmentStates(tx, configId);

      await createAuditLog(tx, {
        action: "segment.created",
        actorUserId: userId,
        configId,
        entityId: segment.id,
        entityType: "segment",
        metadata: toAuditJson({ environmentIds }),
        newValue: this.segmentAuditValue(segment),
        organizationId: config.project.organizationId,
        projectId: config.projectId,
      });

      return segment;
    });
  }

  async update(
    userId: string,
    configId: string,
    segmentId: string,
    input: {
      conditionsJson?: unknown;
      description?: string;
      key?: string;
      name?: string;
    },
  ) {
    const config = await this.findConfigForWrite(userId, configId);
    const segment = await this.findActiveSegment(configId, segmentId);

    const data: Prisma.SegmentUncheckedUpdateInput = {};
    const publicUpdate: SegmentPublicUpdate = {};
    let receivedAnyField = false;

    if (input.key !== undefined) {
      receivedAnyField = true;
      const key = this.normalizeSegmentKey(input.key);
      if (key !== segment.key) {
        await this.ensureSegmentIsNotReferenced(configId, segment.key, "rename");
        data.key = key;
        publicUpdate.key = key;
      }
    }

    if (input.name !== undefined) {
      receivedAnyField = true;
      const name = this.normalizeSegmentName(input.name);
      if (name !== segment.name) {
        data.name = name;
      }
    }

    if (input.description !== undefined) {
      receivedAnyField = true;
      const description = input.description.trim() || null;
      if (description !== segment.description) {
        data.description = description;
      }
    }

    if (input.conditionsJson !== undefined) {
      receivedAnyField = true;
      const conditionsJson = this.normalizeConditionsJson(input.conditionsJson);
      if (!this.jsonValuesEqual(segment.conditionsJson, conditionsJson)) {
        data.conditionsJson = conditionsJson;
        publicUpdate.conditionsJson = conditionsJson;
      }
    }

    if (!receivedAnyField) {
      throw new BadRequestException("No segment fields to update");
    }

    if (Object.keys(data).length === 0) {
      return segment;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedSegment = await tx.segment.update({
        where: { id: segmentId },
        data,
      });
      const changedFields = Object.keys(data);
      const publicChanged = Object.keys(publicUpdate).length > 0;
      const environmentIds = publicChanged
        ? await this.bumpConfigEnvironmentStates(tx, configId)
        : [];

      await createAuditLog(tx, {
        action: "segment.updated",
        actorUserId: userId,
        configId,
        entityId: segmentId,
        entityType: "segment",
        metadata: toAuditJson({ changedFields, environmentIds, publicChanged }),
        newValue: this.segmentAuditValue(updatedSegment),
        oldValue: this.segmentAuditValue(segment),
        organizationId: config.project.organizationId,
        projectId: segment.projectId,
      });

      return updatedSegment;
    });
  }

  async delete(userId: string, configId: string, segmentId: string) {
    const config = await this.findConfigForWrite(userId, configId);
    const segment = await this.findActiveSegment(configId, segmentId);

    await this.ensureSegmentIsNotReferenced(configId, segment.key, "delete");

    await this.prisma.$transaction(async (tx) => {
      const deletedSegment = await tx.segment.update({
        where: { id: segmentId },
        data: { deletedAt: new Date() },
      });
      const environmentIds = await this.bumpConfigEnvironmentStates(tx, configId);

      await createAuditLog(tx, {
        action: "segment.deleted",
        actorUserId: userId,
        configId,
        entityId: segmentId,
        entityType: "segment",
        metadata: toAuditJson({ environmentIds }),
        newValue: this.segmentAuditValue(deletedSegment),
        oldValue: this.segmentAuditValue(segment),
        organizationId: config.project.organizationId,
        projectId: segment.projectId,
      });
    });

    return { ok: true };
  }

  private async bumpConfigEnvironmentStates(tx: Prisma.TransactionClient, configId: string) {
    const states = await tx.configEnvironmentState.findMany({
      where: { configId },
      select: { environmentId: true },
    });

    for (const state of states) {
      await bumpConfigEnvironmentState(tx, configId, state.environmentId);
    }

    return states.map((state) => state.environmentId);
  }

  private async findConfigForWrite(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, ["project_admin", "developer"]);

    return config;
  }

  private async findActiveSegment(configId: string, segmentId: string) {
    const segment = await this.prisma.segment.findFirst({
      where: {
        configId,
        id: segmentId,
        deletedAt: null,
      },
    });

    if (!segment) {
      throw new NotFoundException("Segment not found");
    }

    return segment;
  }

  private async ensureSegmentIsNotReferenced(
    configId: string,
    segmentKey: string,
    action: "delete" | "rename",
  ) {
    const values = await this.prisma.featureFlagEnvironmentValue.findMany({
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

  private normalizeConditionsJson(value: unknown) {
    const conditions = normalizeJsonArray(value, "conditionsJson");

    return conditions.map((condition) =>
      this.normalizeCondition(condition),
    ) as Prisma.InputJsonValue;
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

  private normalizeSegmentKey(value: string | undefined) {
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

  private normalizeSegmentName(value: string | undefined) {
    const name = value?.trim();
    if (!name) {
      throw new BadRequestException("Segment name is required");
    }

    return name;
  }

  private segmentAuditValue(segment: {
    configId: string;
    conditionsJson: Prisma.JsonValue;
    deletedAt?: Date | null;
    description: string | null;
    id: string;
    key: string;
    name: string;
    projectId: string;
  }) {
    return toAuditJson({
      configId: segment.configId,
      conditionsJson: segment.conditionsJson,
      deletedAt: segment.deletedAt?.toISOString() ?? null,
      description: segment.description,
      id: segment.id,
      key: segment.key,
      name: segment.name,
      projectId: segment.projectId,
    });
  }

  private jsonValuesEqual(left: Prisma.JsonValue, right: Prisma.InputJsonValue) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
}

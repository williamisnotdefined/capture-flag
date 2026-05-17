import { BadRequestException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { SegmentsService } from "../src/segments/segments.service";
import {
  SegmentAccessService,
  SegmentAuditService,
  SegmentConfigStateService,
  SegmentReferenceService,
  SegmentUpdateInputService,
  SegmentValidationService,
} from "../src/segments/support";
import {
  BulkDeleteSegmentsService,
  CreateSegmentService,
  DeleteSegmentService,
  ListSegmentsService,
  UpdateSegmentService,
} from "../src/segments/use-cases";

function createSegmentsService(prisma: unknown, access: unknown) {
  const segmentAccess = new SegmentAccessService(prisma as never, access as never);
  const segmentAudit = new SegmentAuditService();
  const segmentConfigState = new SegmentConfigStateService();
  const segmentReference = new SegmentReferenceService();
  const segmentValidation = new SegmentValidationService();
  const segmentUpdateInput = new SegmentUpdateInputService(segmentValidation);

  return new SegmentsService(
    new ListSegmentsService(prisma as never, segmentAccess),
    new CreateSegmentService(
      prisma as never,
      segmentAccess,
      segmentAudit,
      segmentConfigState,
      segmentValidation,
    ),
    new UpdateSegmentService(
      prisma as never,
      segmentAccess,
      segmentAudit,
      segmentConfigState,
      segmentReference,
      segmentUpdateInput,
    ),
    new DeleteSegmentService(
      prisma as never,
      segmentAccess,
      segmentAudit,
      segmentConfigState,
      segmentReference,
    ),
    new BulkDeleteSegmentsService(
      prisma as never,
      segmentAccess,
      segmentAudit,
      segmentConfigState,
      segmentReference,
    ),
  );
}

describe("SegmentsService", () => {
  function createService() {
    const segment = {
      id: "segment-id",
      projectId: "project-id",
      configId: "config-id",
      key: "beta-users",
      name: "Beta users",
      description: null,
      conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
      deletedAt: null,
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { environmentId: "environment-1" },
            { environmentId: "environment-2" },
          ]),
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      segment: {
        create: vi.fn().mockResolvedValue(segment),
        findFirst: vi.fn().mockResolvedValue(segment),
        findMany: vi.fn().mockResolvedValue([segment]),
        update: vi.fn().mockResolvedValue(segment),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      featureFlagEnvironmentValue: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: {
            id: "project-id",
            organizationId: "organization-id",
          },
        }),
      },
      segment: {
        findFirst: vi.fn().mockResolvedValue({
          ...segment,
          project: {
            organizationId: "organization-id",
          },
        }),
        findMany: vi.fn(),
      },
      featureFlagEnvironmentValue: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const access = {
      requireProjectAccess: vi.fn().mockResolvedValue({}),
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };

    return {
      access,
      prisma,
      service: createSegmentsService(prisma, access),
      tx,
    };
  }

  it("creates segments, bumps every config environment state, and audits the change", async () => {
    const { access, prisma, service, tx } = createService();

    await service.create("user-id", "config-id", {
      key: "beta-users",
      name: "Beta users",
      conditionsJson: [{ attribute: " email ", operator: "endsWith", value: "@example.com" }],
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(access.requireProjectRole).toHaveBeenCalledWith("user-id", "project-id", [
      "project_admin",
    ]);
    expect(tx.segment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        configId: "config-id",
        conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
        key: "beta-users",
        name: "Beta users",
        projectId: "project-id",
      }),
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.configEnvironmentState.update).toHaveBeenCalledWith({
      where: {
        configId_environmentId: {
          configId: "config-id",
          environmentId: "environment-1",
        },
      },
      data: expect.objectContaining({
        etag: createConfigEnvironmentEtag("config-id", "environment-1", 2),
      }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "segment.created",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "segment-id",
        entityType: "segment",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("does not let developers manage segments", async () => {
    const { access, prisma, service } = createService();
    access.requireProjectRole.mockRejectedValue(new Error("forbidden"));

    await expect(
      service.create("user-id", "config-id", {
        key: "beta-users",
        name: "Beta users",
      }),
    ).rejects.toThrow("forbidden");

    expect(access.requireProjectRole).toHaveBeenCalledWith("user-id", "project-id", [
      "project_admin",
    ]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not bump config revisions for segment metadata-only updates", async () => {
    const { service, tx } = createService();
    tx.segment.update.mockResolvedValue({
      id: "segment-id",
      projectId: "project-id",
      configId: "config-id",
      key: "beta-users",
      name: "Beta users",
      description: "Updated description",
      conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
      deletedAt: null,
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    });

    await service.update("user-id", "config-id", "segment-id", {
      description: "Updated description",
    });

    expect(tx.segment.update).toHaveBeenCalledWith({
      where: { id: "segment-id" },
      data: { description: "Updated description" },
    });
    expect(tx.configEnvironmentState.findMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "segment.updated",
        metadata: expect.objectContaining({ publicChanged: false }),
      }),
    });
  });

  it("returns without a transaction for no-op segment updates", async () => {
    const { prisma, service, tx } = createService();

    const result = await service.update("user-id", "config-id", "segment-id", {
      name: " Beta users ",
    });

    expect(result).toEqual(expect.objectContaining({ id: "segment-id" }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.segment.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.findMany).not.toHaveBeenCalled();
  });

  it("bumps config states when segment conditions change", async () => {
    const { service, tx } = createService();
    const conditionsJson = [{ attribute: "plan", operator: "equals", value: "enterprise" }];
    tx.segment.update.mockResolvedValue({
      id: "segment-id",
      projectId: "project-id",
      configId: "config-id",
      key: "beta-users",
      name: "Beta users",
      description: null,
      conditionsJson,
      deletedAt: null,
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    });

    await service.update("user-id", "config-id", "segment-id", {
      conditionsJson: [{ attribute: " plan ", operator: "equals", value: "enterprise" }],
    });

    expect(tx.segment.update).toHaveBeenCalledWith({
      where: { id: "segment-id" },
      data: { conditionsJson },
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "segment.updated",
        metadata: {
          changedFields: ["conditionsJson"],
          environmentIds: ["environment-1", "environment-2"],
          publicChanged: true,
        },
      }),
    });
  });

  it("marks segment key updates as public changes and records bumped environments", async () => {
    const { service, tx } = createService();
    tx.segment.update.mockResolvedValue({
      id: "segment-id",
      projectId: "project-id",
      configId: "config-id",
      key: "beta-testers",
      name: "Beta users",
      description: null,
      conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
      deletedAt: null,
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    });

    await service.update("user-id", "config-id", "segment-id", {
      key: "beta-testers",
    });

    expect(tx.segment.update).toHaveBeenCalledWith({
      where: { id: "segment-id" },
      data: { key: "beta-testers" },
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "segment.updated",
        metadata: {
          changedFields: ["key"],
          environmentIds: ["environment-1", "environment-2"],
          publicChanged: true,
        },
      }),
    });
  });

  it("rejects updates without segment fields", async () => {
    const { prisma, service } = createService();

    await expect(service.update("user-id", "config-id", "segment-id", {})).rejects.toThrow(
      "No segment fields to update",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects nested segment conditions", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "config-id", {
        key: "admins",
        name: "Admins",
        conditionsJson: [{ segment: "beta-users" }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects segment conditions with invalid operator values", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "config-id", {
        key: "enterprise",
        name: "Enterprise",
        conditionsJson: [{ attribute: "custom.seats", operator: "greaterThan", value: "10" }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects excessive segment conditions", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "config-id", {
        key: "enterprise",
        name: "Enterprise",
        conditionsJson: Array.from({ length: 51 }, () => ({
          attribute: "country",
          operator: "equals",
          value: "BR",
        })),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects renaming a segment referenced by flag rules", async () => {
    const { service, tx } = createService();
    tx.featureFlagEnvironmentValue.findMany.mockResolvedValue([
      {
        environment: { key: "production" },
        featureFlag: { key: "newCheckout" },
        rulesJson: [
          {
            conditions: [{ segment: "beta-users" }],
            serve: true,
          },
        ],
      },
    ]);

    await expect(
      service.update("user-id", "config-id", "segment-id", {
        key: "beta-testers",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.segment.update).not.toHaveBeenCalled();
  });

  it("rejects deleting a segment referenced by flag rules", async () => {
    const { service, tx } = createService();
    tx.featureFlagEnvironmentValue.findMany.mockResolvedValue([
      {
        environment: { key: "production" },
        featureFlag: { key: "newCheckout" },
        rulesJson: [
          {
            conditions: [{ segment: "beta-users" }],
            serve: true,
          },
        ],
      },
    ]);

    await expect(service.delete("user-id", "config-id", "segment-id")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.segment.update).not.toHaveBeenCalled();
  });

  it("bulk deletes segments in one transaction", async () => {
    const { service, tx } = createService();

    await expect(service.bulkDelete("user-id", "config-id", ["segment-id"])).resolves.toEqual({
      count: 1,
      ok: true,
    });

    expect(tx.segment.findMany).toHaveBeenCalledWith({
      where: { configId: "config-id", id: { in: ["segment-id"] }, deletedAt: null },
    });
    expect(tx.segment.updateMany).toHaveBeenCalledWith({
      where: { configId: "config-id", id: { in: ["segment-id"] }, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "segment.deleted", entityId: "segment-id" }),
    });
  });
});

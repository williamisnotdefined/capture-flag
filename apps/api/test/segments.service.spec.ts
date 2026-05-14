import { BadRequestException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { SegmentsService } from "../src/segments/segments.service";

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
        update: vi.fn().mockResolvedValue(segment),
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
      service: new SegmentsService(prisma as never, access as never),
      tx,
    };
  }

  it("creates segments, bumps every config environment state, and audits the change", async () => {
    const { prisma, service, tx } = createService();

    await service.create("user-id", "config-id", {
      key: "beta-users",
      name: "Beta users",
      conditionsJson: [{ attribute: " email ", operator: "endsWith", value: "@example.com" }],
    });

    expect(prisma.$transaction).toHaveBeenCalled();
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

  it("rejects renaming a segment referenced by flag rules", async () => {
    const { prisma, service } = createService();
    prisma.featureFlagEnvironmentValue.findMany.mockResolvedValue([
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
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects deleting a segment referenced by flag rules", async () => {
    const { prisma, service } = createService();
    prisma.featureFlagEnvironmentValue.findMany.mockResolvedValue([
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
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

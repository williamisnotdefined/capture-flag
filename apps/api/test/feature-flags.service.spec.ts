import { BadRequestException, NotFoundException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { FeatureFlagsService } from "../src/feature-flags/feature-flags.service";

describe("FeatureFlagsService", () => {
  function createService() {
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      environment: {
        findMany: vi.fn().mockResolvedValue([{ id: "environment-1" }, { id: "environment-2" }]),
      },
      featureFlag: {
        create: vi.fn().mockResolvedValue({ id: "flag-id" }),
        findUnique: vi.fn().mockResolvedValue({ id: "flag-id" }),
      },
      featureFlagEnvironmentValue: {
        createMany: vi.fn(),
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
    };
    const access = {
      requireOrganizationMember: vi.fn(),
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };

    return {
      access,
      prisma,
      service: new FeatureFlagsService(prisma as never, access as never),
      tx,
    };
  }

  it("creates environment values and bumps all config environment revisions", async () => {
    const { prisma, service, tx } = createService();

    await service.create("user-id", "config-id", {
      key: "newCheckout",
      name: "New checkout",
      type: "boolean",
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(tx.featureFlag.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        initialDefaultValue: false,
      }),
    });
    expect(tx.featureFlagEnvironmentValue.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          configId: "config-id",
          defaultValue: false,
          environmentId: "environment-1",
          featureFlagId: "flag-id",
          projectId: "project-id",
        }),
        expect.objectContaining({
          configId: "config-id",
          defaultValue: false,
          environmentId: "environment-2",
          featureFlagId: "flag-id",
          projectId: "project-id",
        }),
      ],
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledWith({
      where: {
        configId: "config-id",
        environmentId: "environment-1",
      },
      data: expect.objectContaining({
        revision: { increment: 1 },
      }),
    });
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
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.configEnvironmentState.update).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "flag.created",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "flag-id",
        entityType: "feature_flag",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("creates JSON object flags with JSON defaults", async () => {
    const { service, tx } = createService();
    const defaultValue = {
      layout: { density: "compact" },
      theme: "dark",
    };

    await service.create("user-id", "config-id", {
      defaultValue,
      key: "themeConfig",
      name: "Theme config",
      type: "json_object",
    });

    expect(tx.featureFlag.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        initialDefaultValue: defaultValue,
        type: "json_object",
      }),
    });
    expect(tx.featureFlagEnvironmentValue.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          defaultValue,
          environmentId: "environment-1",
        }),
      ]),
    });
  });

  it("rejects default values that do not match the flag type", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "config-id", {
        defaultValue: "true",
        key: "newCheckout",
        name: "New checkout",
        type: "boolean",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects JSON defaults with the wrong root type", async () => {
    const { prisma, service } = createService();

    await expect(
      service.create("user-id", "config-id", {
        defaultValue: { not: "an array" },
        key: "navigationItems",
        name: "Navigation items",
        type: "json_array",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not bump config revision when an environment value update is a no-op", async () => {
    const existingValue = {
      id: "value-id",
      configId: "config-id",
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
      defaultValue: false,
      environmentId: "environment-id",
      featureFlagId: "flag-id",
      percentageAttribute: "identifier",
      percentageOptionsJson: [],
      projectId: "project-id",
      rulesJson: [],
      updatedAt: new Date("2026-05-12T00:00:00.000Z"),
      updatedByUserId: "user-id",
      environment: {
        id: "environment-id",
        key: "production",
        name: "Production",
        sortOrder: 1,
      },
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      featureFlagEnvironmentValue: {
        findUnique: vi.fn().mockResolvedValue(existingValue),
        upsert: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          key: "newCheckout",
          projectId: "project-id",
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            key: "newCheckout",
            type: "boolean",
            environmentValues: [],
          },
        ]),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    const result = await service.updateEnvironmentValue(
      "user-id",
      "config-id",
      "flag-id",
      "environment-id",
      {
        defaultValue: false,
        percentageAttribute: "identifier",
        percentageOptionsJson: [],
        rulesJson: [],
      },
    );

    expect(result).toBe(existingValue);
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("updates JSON environment values, rules and rollout", async () => {
    const existingValue = {
      id: "value-id",
      configId: "config-id",
      defaultValue: {},
      environmentId: "environment-id",
      featureFlagId: "flag-id",
      percentageAttribute: "identifier",
      percentageOptionsJson: [],
      projectId: "project-id",
      rulesJson: [],
      updatedByUserId: "user-id",
      environment: {
        id: "environment-id",
        key: "production",
        name: "Production",
        sortOrder: 1,
      },
    };
    const defaultValue = { theme: "dark" };
    const rulesJson = [
      {
        conditions: [{ attribute: "country", operator: "equals", value: "BR" }],
        serve: { theme: "br" },
      },
    ];
    const percentageOptionsJson = [{ percentage: 100, value: { theme: "rollout" } }];
    const updatedValue = {
      ...existingValue,
      defaultValue,
      percentageOptionsJson,
      rulesJson,
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "themeConfig",
            type: "json_object",
            environmentValues: [],
          },
        ]),
      },
      featureFlagEnvironmentValue: {
        findUnique: vi.fn().mockResolvedValue(existingValue),
        upsert: vi.fn().mockResolvedValue(updatedValue),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          initialDefaultValue: {},
          key: "themeConfig",
          projectId: "project-id",
          type: "json_object",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
      defaultValue,
      percentageOptionsJson,
      rulesJson,
    });

    expect(tx.featureFlagEnvironmentValue.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          defaultValue,
          percentageOptionsJson,
          rulesJson,
        }),
      }),
    );
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalled();
  });

  it("does not bump config revisions when only private flag metadata changes", async () => {
    const existingFlag = {
      id: "flag-id",
      configId: "config-id",
      deletedAt: null,
      description: null,
      hint: null,
      initialDefaultValue: false,
      key: "newCheckout",
      name: "New checkout",
      ownerUserId: null,
      projectId: "project-id",
      tags: [],
      type: "boolean",
      project: {
        organizationId: "organization-id",
      },
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue(existingFlag),
        findUnique: vi.fn().mockResolvedValue({ ...existingFlag, name: "Updated checkout" }),
        update: vi.fn().mockResolvedValue({ ...existingFlag, name: "Updated checkout" }),
      },
      featureFlagEnvironmentValue: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { environmentId: "environment-1" },
            { environmentId: "environment-2" },
          ]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue(existingFlag),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await service.update("user-id", "config-id", "flag-id", { name: "Updated checkout" });

    expect(tx.featureFlag.update).toHaveBeenCalledWith({
      where: { id: "flag-id" },
      data: { name: "Updated checkout" },
    });
    expect(tx.featureFlagEnvironmentValue.findMany).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "flag.updated",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "flag-id",
        entityType: "feature_flag",
        organizationId: "organization-id",
        projectId: "project-id",
        metadata: expect.objectContaining({ publicChanged: false }),
      }),
    });
  });

  it("does not read a flag by global id before scoped config access", async () => {
    const prisma = {
      $transaction: vi.fn(),
      config: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      featureFlag: {
        findFirst: vi.fn(),
      },
    };
    const access = {
      requireProjectRole: vi.fn(),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(
      service.update("user-id", "config-id", "flag-id", { name: "Updated checkout" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(access.requireProjectRole).not.toHaveBeenCalled();
    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
  });

  it("does not read activity flag details before scoped config access", async () => {
    const prisma = {
      config: {
        findUnique: vi.fn().mockResolvedValue({ projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn(),
      },
      auditLog: {
        findMany: vi.fn(),
      },
    };
    const access = {
      requireProjectAccess: vi.fn().mockRejectedValue(new Error("forbidden")),
      requireProjectRole: vi.fn(),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(service.listActivity("user-id", "config-id", "flag-id")).rejects.toThrow(
      "forbidden",
    );
    expect(access.requireProjectAccess).toHaveBeenCalledWith("user-id", "project-id");
    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("returns paginated feature flag activity", async () => {
    const firstLog = {
      id: "audit-log-2",
      createdAt: new Date("2026-05-12T00:01:00.000Z"),
    };
    const secondLog = {
      id: "audit-log-1",
      createdAt: new Date("2026-05-12T00:00:00.000Z"),
    };
    const prisma = {
      auditLog: {
        findMany: vi.fn().mockResolvedValue([firstLog, secondLog]),
      },
      config: {
        findUnique: vi.fn().mockResolvedValue({ projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          deletedAt: null,
          projectId: "project-id",
          type: "boolean",
        }),
      },
    };
    const access = {
      requireProjectAccess: vi.fn().mockResolvedValue({}),
      requireProjectRole: vi.fn(),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    const result = await service.listActivity("user-id", "config-id", "flag-id", { limit: 1 });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 2,
      }),
    );
    expect(result.items).toEqual([firstLog]);
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it("audits rule additions as first-class audit events", async () => {
    const existingValue = {
      id: "value-id",
      configId: "config-id",
      defaultValue: false,
      environmentId: "environment-id",
      featureFlagId: "flag-id",
      percentageAttribute: "identifier",
      percentageOptionsJson: [],
      projectId: "project-id",
      rulesJson: [],
      updatedByUserId: "user-id",
      environment: {
        id: "environment-id",
        key: "production",
        name: "Production",
        sortOrder: 1,
      },
    };
    const updatedValue = {
      ...existingValue,
      rulesJson: [
        { conditions: [{ attribute: "country", operator: "equals", value: "BR" }], serve: true },
      ],
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "newCheckout",
            type: "boolean",
            environmentValues: [],
          },
        ]),
      },
      featureFlagEnvironmentValue: {
        findUnique: vi.fn().mockResolvedValue(existingValue),
        upsert: vi.fn().mockResolvedValue(updatedValue),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          key: "newCheckout",
          projectId: "project-id",
          type: "boolean",
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
      rulesJson: updatedValue.rulesJson,
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "rule.added",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "value-id",
        entityType: "feature_flag_environment_value",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("rejects rules that reference missing segments", async () => {
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      featureFlagEnvironmentValue: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "newCheckout",
            type: "boolean",
            environmentValues: [],
          },
        ]),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          key: "newCheckout",
          projectId: "project-id",
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(
      service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
        rulesJson: [
          {
            conditions: [{ segment: "missing-segment" }],
            serve: true,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
  });

  it("rejects rules that reference missing prerequisite flags", async () => {
    const tx = {
      featureFlagEnvironmentValue: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "newCheckout",
            type: "boolean",
            environmentValues: [],
          },
        ]),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          key: "newCheckout",
          projectId: "project-id",
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(
      service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
        rulesJson: [
          {
            conditions: [{ prerequisiteFlag: "missingFlag", operator: "equals", value: true }],
            serve: true,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
  });

  it("rejects JSON flags as prerequisites", async () => {
    const tx = {
      featureFlagEnvironmentValue: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "newCheckout",
            type: "boolean",
            environmentValues: [],
          },
          {
            key: "themeConfig",
            type: "json_object",
            environmentValues: [],
          },
        ]),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          key: "newCheckout",
          projectId: "project-id",
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(
      service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
        rulesJson: [
          {
            conditions: [
              { prerequisiteFlag: "themeConfig", operator: "equals", value: { theme: "dark" } },
            ],
            serve: true,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
  });

  it("rejects prerequisite flag cycles in environment rules", async () => {
    const tx = {
      featureFlagEnvironmentValue: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "newCheckout",
            type: "boolean",
            environmentValues: [],
          },
          {
            key: "accountEnabled",
            type: "boolean",
            environmentValues: [
              {
                rulesJson: [
                  {
                    conditions: [
                      { prerequisiteFlag: "newCheckout", operator: "equals", value: true },
                    ],
                    serve: false,
                  },
                ],
              },
            ],
          },
        ]),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          key: "newCheckout",
          projectId: "project-id",
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(
      service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
        rulesJson: [
          {
            conditions: [{ prerequisiteFlag: "accountEnabled", operator: "equals", value: true }],
            serve: true,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
  });

  it("rejects renaming a flag referenced as a prerequisite", async () => {
    const tx = {
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          deletedAt: null,
          description: null,
          hint: null,
          initialDefaultValue: true,
          key: "accountEnabled",
          name: "Account enabled",
          ownerUserId: null,
          projectId: "project-id",
          tags: [],
          type: "boolean",
        }),
        update: vi.fn(),
      },
      featureFlagEnvironmentValue: {
        findMany: vi.fn().mockResolvedValue([
          {
            environment: { key: "production" },
            featureFlag: { key: "newCheckout" },
            rulesJson: [
              {
                conditions: [
                  { prerequisiteFlag: "accountEnabled", operator: "equals", value: true },
                ],
                serve: true,
              },
            ],
          },
        ]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          deletedAt: null,
          description: null,
          hint: null,
          initialDefaultValue: true,
          key: "accountEnabled",
          name: "Account enabled",
          ownerUserId: null,
          projectId: "project-id",
          tags: [],
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await expect(
      service.update("user-id", "config-id", "flag-id", { key: "accountsEnabled" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.featureFlag.update).not.toHaveBeenCalled();
  });

  it("uses the flag initial default when creating a missing environment value", async () => {
    const createdValue = {
      id: "value-id",
      configId: "config-id",
      defaultValue: true,
      environmentId: "environment-id",
      featureFlagId: "flag-id",
      percentageAttribute: "identifier",
      percentageOptionsJson: [],
      projectId: "project-id",
      rulesJson: [],
      updatedByUserId: "user-id",
      environment: {
        id: "environment-id",
        key: "production",
        name: "Production",
        sortOrder: 1,
      },
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      featureFlagEnvironmentValue: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(createdValue),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          initialDefaultValue: true,
          projectId: "project-id",
          type: "boolean",
          project: {
            organizationId: "organization-id",
          },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new FeatureFlagsService(prisma as never, access as never);

    await service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
      rulesJson: [],
    });

    expect(tx.featureFlagEnvironmentValue.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          defaultValue: true,
        }),
      }),
    );
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "flag_value.updated",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "value-id",
        entityType: "feature_flag_environment_value",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });
});

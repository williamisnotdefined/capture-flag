import { BadRequestException, NotFoundException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { FeatureFlagsService } from "../src/feature-flags/feature-flags.service";
import {
  FeatureFlagAccessService,
  FeatureFlagAuditService,
  FeatureFlagConfigStateService,
  FeatureFlagCreateInputService,
  FeatureFlagEnvironmentValueAuditService,
  FeatureFlagEnvironmentValueInitializerService,
  FeatureFlagEnvironmentValueInputService,
  FeatureFlagEnvironmentValueWriterService,
  FeatureFlagPrerequisiteGraphService,
  FeatureFlagPublicValueService,
  FeatureFlagReferenceService,
  FeatureFlagRuleContextService,
  FeatureFlagRulesService,
  FeatureFlagUpdateInputService,
} from "../src/feature-flags/support";
import {
  CreateFeatureFlagService,
  DeleteFeatureFlagService,
  ListFeatureFlagActivityService,
  ListFeatureFlagsService,
  UpdateFeatureFlagEnvironmentValueService,
  UpdateFeatureFlagService,
} from "../src/feature-flags/use-cases";

function createFeatureFlagsService(prisma: unknown, access: unknown) {
  const featureFlagAccess = new FeatureFlagAccessService(prisma as never, access as never);
  const featureFlagAudit = new FeatureFlagAuditService();
  const featureFlagEnvironmentValueAudit = new FeatureFlagEnvironmentValueAuditService();
  const featureFlagEnvironmentValueInput = new FeatureFlagEnvironmentValueInputService();
  const featureFlagPublicValue = new FeatureFlagPublicValueService();
  const featureFlagEnvironmentValueWriter = new FeatureFlagEnvironmentValueWriterService(
    featureFlagPublicValue,
  );
  const featureFlagConfigState = new FeatureFlagConfigStateService();
  const featureFlagCreateInput = new FeatureFlagCreateInputService(featureFlagAccess);
  const featureFlagEnvironmentValueInitializer =
    new FeatureFlagEnvironmentValueInitializerService();
  const featureFlagReference = new FeatureFlagReferenceService();
  const featureFlagRules = new FeatureFlagRulesService(
    new FeatureFlagRuleContextService(),
    new FeatureFlagPrerequisiteGraphService(),
  );
  const featureFlagUpdateInput = new FeatureFlagUpdateInputService(featureFlagAccess);

  return new FeatureFlagsService(
    new ListFeatureFlagsService(prisma as never, featureFlagAccess),
    new CreateFeatureFlagService(
      prisma as never,
      featureFlagAccess,
      featureFlagAudit,
      featureFlagConfigState,
      featureFlagCreateInput,
      featureFlagEnvironmentValueInitializer,
    ),
    new UpdateFeatureFlagService(
      prisma as never,
      featureFlagAccess,
      featureFlagAudit,
      featureFlagConfigState,
      featureFlagReference,
      featureFlagUpdateInput,
    ),
    new DeleteFeatureFlagService(
      prisma as never,
      featureFlagAccess,
      featureFlagAudit,
      featureFlagConfigState,
      featureFlagReference,
    ),
    new ListFeatureFlagActivityService(prisma as never, featureFlagAccess),
    new UpdateFeatureFlagEnvironmentValueService(
      prisma as never,
      featureFlagAccess,
      featureFlagEnvironmentValueAudit,
      featureFlagEnvironmentValueInput,
      featureFlagEnvironmentValueWriter,
      featureFlagRules,
    ),
  );
}

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
        create: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: "flag-id",
            deletedAt: null,
            ...data,
          }),
        ),
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
      service: createFeatureFlagsService(prisma, access),
      tx,
    };
  }

  function createDeleteScenario(
    options: {
      currentFlag?: null | Record<string, unknown>;
      environmentValues?: { environmentId: string }[];
      referenceValues?: unknown[];
    } = {},
  ) {
    const defaultFlag = {
      id: "flag-id",
      configId: "config-id",
      deletedAt: null,
      description: null,
      hint: null,
      initialDefaultValue: false,
      key: "accountEnabled",
      name: "Account enabled",
      ownerUserId: null,
      projectId: "project-id",
      tags: [],
      type: "boolean",
    };
    const currentFlag = options.currentFlag === undefined ? defaultFlag : options.currentFlag;
    const deletedFlag = currentFlag
      ? { ...currentFlag, deletedAt: new Date("2026-05-12T00:00:00.000Z") }
      : null;
    const environmentValues = options.environmentValues ?? [
      { environmentId: "environment-1" },
      { environmentId: "environment-2" },
    ];
    const referenceValues = options.referenceValues ?? [];
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
        findFirst: vi.fn().mockResolvedValue(currentFlag),
        update: vi.fn().mockResolvedValue(deletedFlag),
      },
      featureFlagEnvironmentValue: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce(referenceValues)
          .mockResolvedValueOnce(environmentValues),
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
        findFirst: vi.fn(),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };

    return {
      access,
      currentFlag,
      prisma,
      service: createFeatureFlagsService(prisma, access),
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

  it("creates and audits a flag without bumps when the project has no environments", async () => {
    const { service, tx } = createService();
    tx.environment.findMany.mockResolvedValueOnce([]);

    await service.create("user-id", "config-id", {
      key: "newCheckout",
      name: "New checkout",
      type: "boolean",
    });

    expect(tx.featureFlag.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        initialDefaultValue: false,
      }),
    });
    expect(tx.featureFlagEnvironmentValue.createMany).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.updateMany).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "flag.created",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "flag-id",
        entityType: "feature_flag",
        metadata: { environmentIds: [] },
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
    const service = createFeatureFlagsService(prisma, access);

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

  it("does not load rule context when rulesJson is empty", async () => {
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
    const tx = {
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      featureFlagEnvironmentValue: {
        findUnique: vi.fn().mockResolvedValue(existingValue),
        upsert: vi.fn(),
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
          initialDefaultValue: false,
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
    const service = createFeatureFlagsService(prisma, access);

    const result = await service.updateEnvironmentValue(
      "user-id",
      "config-id",
      "flag-id",
      "environment-id",
      { rulesJson: [] },
    );

    expect(result).toBe(existingValue);
    expect(tx.segment.findMany).not.toHaveBeenCalled();
    expect(tx.featureFlag.findMany).not.toHaveBeenCalled();
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
  });

  it("does not bump config revision when JSON object keys are reordered", async () => {
    const existingValue = {
      id: "value-id",
      configId: "config-id",
      defaultValue: {
        layout: { density: "compact", modules: ["checkout", "billing"] },
        theme: "dark",
      },
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
          initialDefaultValue: {},
          key: "themeConfig",
          projectId: "project-id",
          type: "json_object",
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createFeatureFlagsService(prisma, access);

    const result = await service.updateEnvironmentValue(
      "user-id",
      "config-id",
      "flag-id",
      "environment-id",
      {
        defaultValue: {
          theme: "dark",
          layout: { modules: ["checkout", "billing"], density: "compact" },
        },
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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

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

  it("returns the read model without transaction when private metadata update is a no-op", async () => {
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
    };
    const readModel = { ...existingFlag, environmentValues: [] };
    const prisma = {
      $transaction: vi.fn(),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue(existingFlag),
        findUnique: vi.fn().mockResolvedValue(readModel),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createFeatureFlagsService(prisma, access);

    const result = await service.update("user-id", "config-id", "flag-id", {
      name: "  New checkout  ",
    });

    expect(result).toBe(readModel);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.featureFlag.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "flag-id" } }),
    );
  });

  it("rejects feature flag updates without fields", async () => {
    const prisma = {
      $transaction: vi.fn(),
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
          initialDefaultValue: false,
          key: "newCheckout",
          name: "New checkout",
          ownerUserId: null,
          projectId: "project-id",
          tags: [],
          type: "boolean",
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createFeatureFlagsService(prisma, access);

    await expect(service.update("user-id", "config-id", "flag-id", {})).rejects.toThrow(
      "No feature flag fields to update",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("audits public metadata when renaming a flag", async () => {
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
    };
    const updatedFlag = { ...existingFlag, key: "nextCheckout" };
    const state = {
      id: "state-id",
      etag: "old-etag",
      generatedAt: new Date("2026-05-12T00:00:00.000Z"),
      revision: 2,
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue(state),
        update: vi.fn().mockResolvedValue({ ...state, etag: "new-etag", revision: 3 }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue(existingFlag),
        findUnique: vi.fn().mockResolvedValue(updatedFlag),
        update: vi.fn().mockResolvedValue(updatedFlag),
      },
      featureFlagEnvironmentValue: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
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
    const service = createFeatureFlagsService(prisma, access);

    await service.update("user-id", "config-id", "flag-id", { key: "nextCheckout" });

    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "flag.updated",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "flag-id",
        entityType: "feature_flag",
        metadata: expect.objectContaining({
          changedFields: ["key"],
          environmentIds: ["environment-1", "environment-2"],
          publicChanged: true,
        }),
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("deletes, bumps all affected environment revisions, and audits flag.deleted", async () => {
    const { service, tx } = createDeleteScenario();

    const result = await service.delete("user-id", "config-id", "flag-id");

    expect(result).toEqual({ ok: true });
    expect(tx.featureFlag.update).toHaveBeenCalledWith({
      where: { id: "flag-id" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(tx.featureFlagEnvironmentValue.findMany).toHaveBeenNthCalledWith(2, {
      where: { featureFlagId: "flag-id" },
      select: { environmentId: true },
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
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledWith({
      where: {
        configId: "config-id",
        environmentId: "environment-2",
      },
      data: expect.objectContaining({
        revision: { increment: 1 },
      }),
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "flag.deleted",
        actorUserId: "user-id",
        configId: "config-id",
        entityId: "flag-id",
        entityType: "feature_flag",
        metadata: { environmentIds: ["environment-1", "environment-2"] },
        newValue: expect.objectContaining({
          deletedAt: expect.any(String),
          key: "accountEnabled",
        }),
        oldValue: expect.objectContaining({
          deletedAt: null,
          key: "accountEnabled",
        }),
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("blocks deleting a flag referenced as a prerequisite", async () => {
    const { service, tx } = createDeleteScenario({
      referenceValues: [
        {
          environment: { key: "production" },
          featureFlag: { key: "newCheckout" },
          rulesJson: [
            {
              conditions: [{ prerequisiteFlag: "accountEnabled", operator: "equals", value: true }],
              serve: true,
            },
          ],
        },
      ],
    });

    await expect(service.delete("user-id", "config-id", "flag-id")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.featureFlagEnvironmentValue.findMany).toHaveBeenCalledTimes(1);
    expect(tx.featureFlag.update).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not update when deleting a missing flag", async () => {
    const { service, tx } = createDeleteScenario({ currentFlag: null });

    await expect(service.delete("user-id", "config-id", "flag-id")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tx.featureFlag.update).not.toHaveBeenCalled();
    expect(tx.featureFlagEnvironmentValue.findMany).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.updateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("requires tenant access before delete writes", async () => {
    const prisma = {
      $transaction: vi.fn(),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      featureFlag: {
        findFirst: vi.fn(),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockRejectedValue(new Error("forbidden")),
    };
    const service = createFeatureFlagsService(prisma, access);

    await expect(service.delete("user-id", "config-id", "flag-id")).rejects.toThrow("forbidden");
    expect(access.requireProjectRole).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

    await expect(service.listActivity("user-id", "config-id", "flag-id")).rejects.toThrow(
      "forbidden",
    );
    expect(access.requireProjectAccess).toHaveBeenCalledWith("user-id", "project-id");
    expect(prisma.featureFlag.findFirst).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("rejects environment value updates for environments outside the flag project", async () => {
    const prisma = {
      $transaction: vi.fn(),
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "other-project" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
          projectId: "project-id",
          type: "boolean",
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createFeatureFlagsService(prisma, access);

    await expect(
      service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
        rulesJson: [],
      }),
    ).rejects.toThrow("Environment does not belong to the flag project");
    expect(prisma.$transaction).not.toHaveBeenCalled();
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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

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

  it("audits rule removals as first-class audit events", async () => {
    const existingValue = {
      id: "value-id",
      configId: "config-id",
      defaultValue: false,
      environmentId: "environment-id",
      featureFlagId: "flag-id",
      percentageAttribute: "identifier",
      percentageOptionsJson: [],
      projectId: "project-id",
      rulesJson: [
        { conditions: [{ attribute: "country", operator: "equals", value: "BR" }], serve: true },
        { conditions: [{ attribute: "plan", operator: "equals", value: "pro" }], serve: true },
      ],
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
    const service = createFeatureFlagsService(prisma, access);

    await service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
      rulesJson: updatedValue.rulesJson,
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "rule.removed",
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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

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

  it("rejects indirect prerequisite flag cycles in environment rules", async () => {
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
            key: "betaGate",
            type: "boolean",
            environmentValues: [
              {
                rulesJson: [
                  {
                    conditions: [
                      { prerequisiteFlag: "accountEnabled", operator: "equals", value: true },
                    ],
                    serve: false,
                  },
                ],
              },
            ],
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
    const service = createFeatureFlagsService(prisma, access);

    await expect(
      service.updateEnvironmentValue("user-id", "config-id", "flag-id", "environment-id", {
        rulesJson: [
          {
            conditions: [{ prerequisiteFlag: "betaGate", operator: "equals", value: true }],
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
    const service = createFeatureFlagsService(prisma, access);

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
    const service = createFeatureFlagsService(prisma, access);

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

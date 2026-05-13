import { BadRequestException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { FeatureFlagsService } from "../src/feature-flags/feature-flags.service";

describe("FeatureFlagsService", () => {
  function createService() {
    const tx = {
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
      environment: {
        findUnique: vi.fn().mockResolvedValue({ id: "environment-id", projectId: "project-id" }),
      },
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({
          id: "flag-id",
          configId: "config-id",
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

    const result = await service.updateEnvironmentValue("user-id", "flag-id", "environment-id", {
      defaultValue: false,
      percentageAttribute: "identifier",
      percentageOptionsJson: [],
      rulesJson: [],
    });

    expect(result).toBe(existingValue);
    expect(tx.featureFlagEnvironmentValue.upsert).not.toHaveBeenCalled();
    expect(tx.configEnvironmentState.updateMany).not.toHaveBeenCalled();
  });
});

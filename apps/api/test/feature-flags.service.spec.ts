import { BadRequestException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { FeatureFlagsService } from "../src/feature-flags/feature-flags.service";

describe("FeatureFlagsService", () => {
  function createService() {
    const tx = {
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({ revision: 1 }),
        update: vi.fn(),
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
    expect(tx.configEnvironmentState.update).toHaveBeenCalledWith({
      where: {
        configId_environmentId: {
          configId: "config-id",
          environmentId: "environment-1",
        },
      },
      data: expect.objectContaining({
        etag: createConfigEnvironmentEtag("config-id", "environment-1", 2),
        revision: 2,
      }),
    });
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
});

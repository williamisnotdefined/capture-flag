import { PublicSdkService } from "../src/public-sdk/public-sdk.service";

describe("PublicSdkService", () => {
  function createService() {
    const prisma = {
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({
          etag: 'W/"cf-2-config-environment"',
          generatedAt: new Date("2026-05-12T00:00:00.000Z"),
          revision: 2,
        }),
      },
      featureFlagEnvironmentValue: {
        findMany: vi.fn().mockResolvedValue([
          {
            defaultValue: false,
            percentageAttribute: "identifier",
            percentageOptionsJson: [],
            rulesJson: [],
            featureFlag: {
              key: "newCheckout",
              type: "boolean",
            },
          },
        ]),
      },
      sdkKey: {
        findUnique: vi.fn().mockResolvedValue({
          id: "sdk-key-id",
          configId: "config-id",
          environmentId: "environment-id",
          revokedAt: null,
          project: {
            id: "project-id",
            slug: "ecommerce",
          },
          config: {
            id: "config-id",
            key: "frontend-web",
          },
          environment: {
            id: "environment-id",
            key: "production",
          },
        }),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation((callback) => callback(prisma));

    return {
      prisma,
      service: new PublicSdkService(prisma as never),
    };
  }

  it("returns public config JSON scoped to the SDK key", async () => {
    const { prisma, service } = createService();

    const result = await service.getConfig("cf_sdk_raw");

    expect(result.cacheControl).toBe("public, no-cache");
    expect(result.notModified).toBe(false);
    if (!result.notModified) {
      expect(result.body).toMatchObject({
        configKey: "frontend-web",
        environment: "production",
        flags: {
          newCheckout: {
            defaultValue: false,
            percentageAttribute: "identifier",
            percentageOptions: [],
            rules: [],
            type: "boolean",
          },
        },
        generatedAt: "2026-05-12T00:00:00.000Z",
        projectKey: "ecommerce",
        revision: 2,
        schemaVersion: 1,
      });
    }
    expect(prisma.featureFlagEnvironmentValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          configId: "config-id",
          environmentId: "environment-id",
          featureFlag: {
            deletedAt: null,
          },
        },
      }),
    );
    expect(prisma.sdkKey.update).toHaveBeenCalledWith({
      where: { id: "sdk-key-id" },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it("returns not modified when If-None-Match matches the current ETag", async () => {
    const { prisma, service } = createService();

    const result = await service.getConfig("cf_sdk_raw", 'W/"cf-2-config-environment"');

    expect(result).toMatchObject({
      etag: 'W/"cf-2-config-environment"',
      notModified: true,
    });
    expect(prisma.featureFlagEnvironmentValue.findMany).not.toHaveBeenCalled();
  });

  it("uses weak ETag comparison for If-None-Match", async () => {
    const { prisma, service } = createService();

    const result = await service.getConfig("cf_sdk_raw", '"cf-2-config-environment"');

    expect(result).toMatchObject({
      etag: 'W/"cf-2-config-environment"',
      notModified: true,
    });
    expect(prisma.featureFlagEnvironmentValue.findMany).not.toHaveBeenCalled();
  });
});

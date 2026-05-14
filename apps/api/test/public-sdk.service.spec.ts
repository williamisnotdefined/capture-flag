import { PublicSdkService } from "../src/public-sdk/public-sdk.service";

describe("PublicSdkService", () => {
  function createService() {
    const prisma = {
      config: {
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          key: "frontend-web",
          projectId: "project-id",
          project: {
            id: "project-id",
            slug: "ecommerce",
          },
        }),
      },
      configEnvironmentState: {
        findUnique: vi.fn().mockResolvedValue({
          etag: 'W/"cf-2-config-environment"',
          generatedAt: new Date("2026-05-12T00:00:00.000Z"),
          revision: 2,
        }),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          {
            initialDefaultValue: false,
            key: "newCheckout",
            type: "boolean",
            environmentValues: [
              {
                defaultValue: false,
                percentageAttribute: "identifier",
                percentageOptionsJson: [],
                rulesJson: [
                  {
                    conditions: [
                      { prerequisiteFlag: "accountEnabled", operator: "equals", value: true },
                      { attribute: "custom.tags", operator: "arrayContains", value: "beta" },
                    ],
                    serve: true,
                  },
                ],
              },
            ],
          },
        ]),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue({
          id: "environment-id",
          key: "production",
          projectId: "project-id",
        }),
      },
      segment: {
        findMany: vi.fn().mockResolvedValue([
          {
            key: "beta-users",
            conditionsJson: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
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
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    const access = {
      requireProjectAccess: vi.fn().mockResolvedValue({}),
    };

    return {
      access,
      prisma,
      service: new PublicSdkService(prisma as never, access as never),
    };
  }

  it("returns public config JSON scoped to the SDK key", async () => {
    const { prisma, service } = createService();

    const result = await service.getConfig("cf_sdk_raw");

    expect(result.cacheControl).toBe("private, no-cache");
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
            rules: [
              {
                conditions: [
                  { prerequisiteFlag: "accountEnabled", operator: "equals", value: true },
                  { attribute: "custom.tags", operator: "arrayContains", value: "beta" },
                ],
                serve: true,
              },
            ],
            type: "boolean",
          },
        },
        generatedAt: "2026-05-12T00:00:00.000Z",
        projectKey: "ecommerce",
        revision: 2,
        schemaVersion: 1,
        segments: {
          "beta-users": {
            conditions: [{ attribute: "email", operator: "endsWith", value: "@example.com" }],
          },
        },
      });
    }
    expect(prisma.featureFlag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        where: {
          configId: "config-id",
          deletedAt: null,
        },
        include: {
          environmentValues: {
            where: { environmentId: "environment-id" },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 1,
          },
        },
      }),
    );
    expect(prisma.segment.findMany).toHaveBeenCalledWith({
      where: {
        configId: "config-id",
        deletedAt: null,
      },
      orderBy: [{ key: "asc" }, { id: "asc" }],
    });
    expect(prisma.sdkKey.updateMany).toHaveBeenCalledWith({
      where: { id: "sdk-key-id", revokedAt: null },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it("uses PUBLIC_CONFIG_CACHE_CONTROL when configured", async () => {
    vi.stubEnv("PUBLIC_CONFIG_CACHE_CONTROL", "public, max-age=60");
    const { service } = createService();

    try {
      const result = await service.getConfig("cf_sdk_raw");

      expect(result.cacheControl).toBe("public, max-age=60");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("returns not modified when If-None-Match matches the current ETag", async () => {
    const { prisma, service } = createService();

    const result = await service.getConfig("cf_sdk_raw", 'W/"cf-2-config-environment"');

    expect(result).toMatchObject({
      etag: 'W/"cf-2-config-environment"',
      notModified: true,
    });
    expect(prisma.featureFlag.findMany).not.toHaveBeenCalled();
    expect(prisma.segment.findMany).not.toHaveBeenCalled();
    expect(prisma.sdkKey.updateMany).toHaveBeenCalledWith({
      where: { id: "sdk-key-id", revokedAt: null },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it("uses weak ETag comparison for If-None-Match", async () => {
    const { prisma, service } = createService();

    const result = await service.getConfig("cf_sdk_raw", '"cf-2-config-environment"');

    expect(result).toMatchObject({
      etag: 'W/"cf-2-config-environment"',
      notModified: true,
    });
    expect(prisma.featureFlag.findMany).not.toHaveBeenCalled();
    expect(prisma.segment.findMany).not.toHaveBeenCalled();
  });

  it("uses the flag initial default when the environment value row is missing", async () => {
    const { prisma, service } = createService();
    prisma.featureFlag.findMany.mockResolvedValue([
      {
        initialDefaultValue: true,
        key: "newCheckout",
        type: "boolean",
        environmentValues: [],
      },
    ]);

    const result = await service.getConfig("cf_sdk_raw");

    expect(result.notModified).toBe(false);
    if (!result.notModified) {
      expect(result.body.flags.newCheckout).toMatchObject({
        defaultValue: true,
        percentageAttribute: "identifier",
        percentageOptions: [],
        rules: [],
        type: "boolean",
      });
    }
  });

  it("rejects invalid persisted JSON arrays instead of masking public config", async () => {
    const { prisma, service } = createService();
    prisma.featureFlag.findMany.mockResolvedValue([
      {
        initialDefaultValue: false,
        key: "newCheckout",
        type: "boolean",
        environmentValues: [
          {
            defaultValue: false,
            percentageAttribute: "identifier",
            percentageOptionsJson: [],
            rulesJson: { invalid: true },
          },
        ],
      },
    ]);

    await expect(service.getConfig("cf_sdk_raw")).rejects.toThrow(
      "Public config contains an invalid JSON array",
    );
    expect(prisma.sdkKey.updateMany).not.toHaveBeenCalled();
  });

  it("returns config when recording SDK key usage fails", async () => {
    const { prisma, service } = createService();
    prisma.sdkKey.updateMany.mockRejectedValue(new Error("usage write failed"));

    const result = await service.getConfig("cf_sdk_raw");

    expect(result.notModified).toBe(false);
    if (!result.notModified) {
      expect(result.body.flags.newCheckout.defaultValue).toBe(false);
    }
  });

  it("returns private preview without requiring the raw SDK key", async () => {
    const { access, prisma, service } = createService();

    const result = await service.previewConfig("user-id", "config-id", "environment-id");

    expect(access.requireProjectAccess).toHaveBeenCalledWith("user-id", "project-id");
    expect(result).toMatchObject({
      etag: 'W/"cf-2-config-environment"',
      body: {
        configKey: "frontend-web",
        environment: "production",
        projectKey: "ecommerce",
      },
    });
    expect(prisma.sdkKey.findUnique).not.toHaveBeenCalled();
    expect(prisma.sdkKey.updateMany).not.toHaveBeenCalled();
  });
});

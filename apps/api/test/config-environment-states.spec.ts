import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { ConfigsService } from "../src/configs/configs.service";
import { EnvironmentsService } from "../src/environments/environments.service";

describe("config/environment state creation", () => {
  it("creates state rows for existing environments when creating a config", async () => {
    const config = {
      id: "config-id",
      key: "web",
      name: "Web",
      projectId: "project-id",
    };
    const environments = [
      { id: "environment-1", projectId: "project-id" },
      { id: "environment-2", projectId: "project-id" },
    ];
    const tx = {
      config: {
        create: vi.fn().mockResolvedValue(config),
      },
      configEnvironmentState: {
        createMany: vi.fn(),
      },
      environment: {
        findMany: vi.fn().mockResolvedValue(environments),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new ConfigsService(prisma as never, access as never);

    await service.create("user-id", "project-id", { name: "Web" });

    expect(tx.configEnvironmentState.createMany).toHaveBeenCalledWith({
      data: environments.map((environment) =>
        expect.objectContaining({
          configId: "config-id",
          environmentId: environment.id,
          etag: createConfigEnvironmentEtag("config-id", environment.id, 1),
          projectId: "project-id",
          revision: 1,
        }),
      ),
    });
  });

  it("creates state rows for existing configs when creating an environment", async () => {
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "project-id",
      sortOrder: 1,
    };
    const configs = [
      { id: "config-1", projectId: "project-id" },
      { id: "config-2", projectId: "project-id" },
    ];
    const tx = {
      config: {
        findMany: vi.fn().mockResolvedValue(configs),
      },
      configEnvironmentState: {
        createMany: vi.fn(),
      },
      environment: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue(environment),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      featureFlagEnvironmentValue: {
        createMany: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new EnvironmentsService(prisma as never, access as never);

    await service.create("user-id", "project-id", { name: "Production" });

    expect(tx.configEnvironmentState.createMany).toHaveBeenCalledWith({
      data: configs.map((config) =>
        expect.objectContaining({
          configId: config.id,
          environmentId: "environment-id",
          etag: createConfigEnvironmentEtag(config.id, "environment-id", 1),
          projectId: "project-id",
          revision: 1,
        }),
      ),
    });
    expect(tx.featureFlagEnvironmentValue.createMany).not.toHaveBeenCalled();
  });

  it("creates initial values for existing flags when creating an environment", async () => {
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "project-id",
      sortOrder: 1,
    };
    const flags = [
      { id: "flag-1", configId: "config-1", type: "boolean" },
      { id: "flag-2", configId: "config-1", type: "string" },
    ];
    const tx = {
      config: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      configEnvironmentState: {
        createMany: vi.fn(),
      },
      environment: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue(environment),
      },
      featureFlag: {
        findMany: vi.fn().mockResolvedValue(flags),
      },
      featureFlagEnvironmentValue: {
        createMany: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = new EnvironmentsService(prisma as never, access as never);

    await service.create("user-id", "project-id", { name: "Production" });

    expect(tx.featureFlagEnvironmentValue.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          configId: "config-1",
          defaultValue: false,
          environmentId: "environment-id",
          featureFlagId: "flag-1",
          projectId: "project-id",
        }),
        expect.objectContaining({
          configId: "config-1",
          defaultValue: "",
          environmentId: "environment-id",
          featureFlagId: "flag-2",
          projectId: "project-id",
        }),
      ],
    });
  });
});

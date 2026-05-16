import { BadRequestException } from "@nestjs/common";
import { createConfigEnvironmentEtag } from "../src/common/config-state";
import { ConfigsService } from "../src/configs/configs.service";
import {
  ConfigAccessService,
  ConfigAuditService,
  ConfigEnvironmentStateService,
} from "../src/configs/support";
import {
  CreateConfigService,
  DeleteConfigService,
  ListConfigsService,
} from "../src/configs/use-cases";
import { EnvironmentsService } from "../src/environments/environments.service";
import {
  EnvironmentAccessService,
  EnvironmentConfigStateService,
  EnvironmentFeatureFlagValuesService,
} from "../src/environments/support";
import {
  CreateEnvironmentService,
  DeleteEnvironmentService,
  ListEnvironmentsService,
  UpdateEnvironmentService,
} from "../src/environments/use-cases";

function createConfigsService(prisma: never, access: never) {
  const configAccess = new ConfigAccessService(prisma, access);
  const configAudit = new ConfigAuditService();
  const configEnvironmentState = new ConfigEnvironmentStateService();

  return new ConfigsService(
    new ListConfigsService(prisma, configAccess),
    new CreateConfigService(prisma, configAccess, configAudit, configEnvironmentState),
    new DeleteConfigService(prisma, configAccess, configAudit),
  );
}

function createEnvironmentsService(prisma: never, access: never) {
  const environmentAccess = new EnvironmentAccessService(prisma, access);
  const environmentConfigState = new EnvironmentConfigStateService();
  const environmentFeatureFlagValues = new EnvironmentFeatureFlagValuesService();

  return new EnvironmentsService(
    new ListEnvironmentsService(prisma, environmentAccess),
    new CreateEnvironmentService(
      prisma,
      environmentAccess,
      environmentConfigState,
      environmentFeatureFlagValues,
    ),
    new UpdateEnvironmentService(prisma, environmentAccess, environmentConfigState),
    new DeleteEnvironmentService(prisma, environmentAccess),
  );
}

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
      auditLog: {
        create: vi.fn(),
      },
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
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createConfigsService(prisma as never, access as never);

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
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

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
      { id: "flag-1", configId: "config-1", initialDefaultValue: true, type: "boolean" },
      {
        id: "flag-2",
        configId: "config-1",
        initialDefaultValue: "created-value",
        type: "string",
      },
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
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await service.create("user-id", "project-id", { name: "Production" });

    expect(tx.featureFlagEnvironmentValue.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          configId: "config-1",
          defaultValue: true,
          environmentId: "environment-id",
          featureFlagId: "flag-1",
          projectId: "project-id",
        }),
        expect.objectContaining({
          configId: "config-1",
          defaultValue: "created-value",
          environmentId: "environment-id",
          featureFlagId: "flag-2",
          projectId: "project-id",
        }),
      ],
    });
  });

  it("bumps all config state rows when an environment key changes", async () => {
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "project-id",
      sortOrder: 1,
    };
    const tx = {
      configEnvironmentState: {
        findMany: vi.fn().mockResolvedValue([{ configId: "config-1" }, { configId: "config-2" }]),
        findUnique: vi.fn().mockResolvedValue({ revision: 2 }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      environment: {
        update: vi.fn().mockResolvedValue({ ...environment, key: "prod" }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      environment: {
        findUnique: vi.fn().mockResolvedValue(environment),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await service.update("user-id", "environment-id", { key: "prod" });

    expect(tx.configEnvironmentState.findMany).toHaveBeenCalledWith({
      where: {
        environmentId: "environment-id",
        projectId: "project-id",
      },
      select: { configId: true },
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledWith({
      where: {
        configId: "config-1",
        environmentId: "environment-id",
      },
      data: expect.objectContaining({
        revision: { increment: 1 },
      }),
    });
    expect(tx.configEnvironmentState.update).toHaveBeenCalledWith({
      where: {
        configId_environmentId: {
          configId: "config-1",
          environmentId: "environment-id",
        },
      },
      data: {
        etag: createConfigEnvironmentEtag("config-1", "environment-id", 2),
      },
    });
    expect(tx.configEnvironmentState.updateMany).toHaveBeenCalledTimes(2);
  });

  it("audits config publication when an environment key changes", async () => {
    const generatedAt = new Date("2026-05-12T00:00:00.000Z");
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "project-id",
      sortOrder: 1,
    };
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      configEnvironmentState: {
        findMany: vi.fn().mockResolvedValue([{ configId: "config-1" }]),
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            etag: createConfigEnvironmentEtag("config-1", "environment-id", 1),
            generatedAt,
            id: "state-id",
            revision: 1,
          })
          .mockResolvedValueOnce({ generatedAt, revision: 2 }),
        update: vi.fn().mockResolvedValue({
          etag: createConfigEnvironmentEtag("config-1", "environment-id", 2),
          generatedAt,
          id: "state-id",
          revision: 2,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      environment: {
        update: vi.fn().mockResolvedValue({ ...environment, key: "prod" }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      environment: {
        findUnique: vi.fn().mockResolvedValue(environment),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await service.update("user-id", "environment-id", { key: "prod" });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "config.published",
        actorUserId: "user-id",
        configId: "config-1",
        entityId: "state-id",
        entityType: "config_environment_state",
        organizationId: "organization-id",
        projectId: "project-id",
      }),
    });
  });

  it("does not hard delete configs with audit history", async () => {
    const prisma = {
      $transaction: vi.fn(),
      auditLog: {
        count: vi.fn().mockResolvedValue(1),
      },
      config: {
        count: vi.fn().mockResolvedValue(2),
        delete: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({
          id: "config-id",
          description: null,
          key: "default",
          name: "Default",
          projectId: "project-id",
          project: { organizationId: "organization-id" },
        }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({}),
    };
    const service = createConfigsService(prisma as never, access as never);

    await expect(service.delete("user-id", "config-id")).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: { configId: "config-id" } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.config.delete).not.toHaveBeenCalled();
  });
});

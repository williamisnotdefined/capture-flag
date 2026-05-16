import { ForbiddenException, NotFoundException } from "@nestjs/common";
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

describe("EnvironmentsService", () => {
  it("lists only environments for the authorized project", async () => {
    const environments = [
      { id: "environment-1", projectId: "project-id", sortOrder: 1 },
      { id: "environment-2", projectId: "project-id", sortOrder: 2 },
    ];
    const prisma = {
      environment: {
        findMany: vi.fn().mockResolvedValue(environments),
      },
    };
    const access = {
      requireProjectAccess: vi.fn().mockResolvedValue({}),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await expect(service.list("user-id", "project-id")).resolves.toEqual(environments);

    expect(access.requireProjectAccess).toHaveBeenCalledWith("user-id", "project-id");
    expect(prisma.environment.findMany).toHaveBeenCalledWith({
      where: { projectId: "project-id" },
      orderBy: { sortOrder: "asc" },
    });
  });

  it("does not bump config state when updating only name and sortOrder", async () => {
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "project-id",
      sortOrder: 1,
    };
    const prisma = {
      $transaction: vi.fn(),
      environment: {
        findUnique: vi.fn().mockResolvedValue(environment),
        update: vi.fn().mockResolvedValue({ ...environment, name: "Prod", sortOrder: 2 }),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await service.update("user-id", "environment-id", { name: "Prod", sortOrder: 2 });

    expect(prisma.environment.update).toHaveBeenCalledWith({
      where: { id: "environment-id" },
      data: { name: "Prod", sortOrder: 2 },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not leak an environment from a project the user cannot manage", async () => {
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "other-project-id",
      sortOrder: 1,
    };
    const prisma = {
      environment: {
        findUnique: vi.fn().mockResolvedValue(environment),
        update: vi.fn(),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockRejectedValue(new ForbiddenException("Forbidden")),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await expect(
      service.update("user-id", "environment-id", { name: "Prod" }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(access.requireProjectRole).toHaveBeenCalledWith("user-id", "other-project-id", [
      "project_admin",
    ]);
    expect(prisma.environment.update).not.toHaveBeenCalled();
  });

  it("deletes an environment only after project manager access succeeds", async () => {
    const environment = {
      id: "environment-id",
      key: "production",
      name: "Production",
      projectId: "project-id",
      sortOrder: 1,
    };
    const prisma = {
      environment: {
        delete: vi.fn().mockResolvedValue(environment),
        findUnique: vi.fn().mockResolvedValue(environment),
      },
    };
    const access = {
      requireProjectRole: vi.fn().mockResolvedValue({
        project: { organizationId: "organization-id" },
      }),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await expect(service.delete("user-id", "environment-id")).resolves.toEqual({ ok: true });

    expect(access.requireProjectRole).toHaveBeenCalledWith("user-id", "project-id", [
      "project_admin",
    ]);
    expect(prisma.environment.delete).toHaveBeenCalledWith({ where: { id: "environment-id" } });
  });

  it("does not delete a missing environment", async () => {
    const prisma = {
      environment: {
        delete: vi.fn(),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    const access = {
      requireProjectRole: vi.fn(),
    };
    const service = createEnvironmentsService(prisma as never, access as never);

    await expect(service.delete("user-id", "environment-id")).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(access.requireProjectRole).not.toHaveBeenCalled();
    expect(prisma.environment.delete).not.toHaveBeenCalled();
  });
});

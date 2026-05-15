import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ApiTokenTenantGuard } from "../src/api-tokens/api-token-tenant.guard";

describe("ApiTokenTenantGuard", () => {
  function createContext(
    params: Record<string, string>,
    apiToken = { organizationId: "org-1", projectId: null },
  ) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          apiToken: {
            id: "token-id",
            scopes: [],
            tokenPrefix: "cf_api_prefix",
            userId: "user-id",
            ...apiToken,
          },
          body: {},
          params,
          query: {},
        }),
      }),
      getHandler: () => "handler",
      getClass: () => "class",
    } as unknown as ExecutionContext;
  }

  function createGuard(
    requirement: unknown,
    project: { id: string; organizationId: string } | null,
  ) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(requirement),
    };
    const prisma = {
      project: {
        findUnique: vi.fn().mockResolvedValue(project),
      },
    };

    return {
      guard: new ApiTokenTenantGuard(reflector as never, prisma as never),
      prisma,
    };
  }

  it("allows project resources inside the API token organization", async () => {
    const { guard, prisma } = createGuard(
      { projectParam: "projectId" },
      { id: "project-id", organizationId: "org-1" },
    );

    await expect(
      guard.canActivate(createContext({ projectId: "00000000-0000-4000-8000-000000000001" })),
    ).resolves.toBe(true);
    expect(prisma.project.findUnique).toHaveBeenCalled();
  });

  it("rejects project resources outside the API token organization", async () => {
    const { guard } = createGuard(
      { projectParam: "projectId" },
      { id: "project-id", organizationId: "org-2" },
    );

    await expect(
      guard.canActivate(createContext({ projectId: "00000000-0000-4000-8000-000000000001" })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

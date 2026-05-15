import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ApiTokenTenantGuard } from "../src/api-tokens/api-token-tenant.guard";

const organizationId = "00000000-0000-4000-8000-000000000001";
const otherOrganizationId = "00000000-0000-4000-8000-000000000002";
const projectId = "00000000-0000-4000-8000-000000000003";
const otherProjectId = "00000000-0000-4000-8000-000000000004";
const configId = "00000000-0000-4000-8000-000000000005";
const segmentId = "00000000-0000-4000-8000-000000000006";

describe("ApiTokenTenantGuard", () => {
  function createContext({
    apiToken = { organizationId, projectId: null },
    body = {},
    params = {},
    query = {},
  }: {
    apiToken?: { organizationId: string; projectId: string | null };
    body?: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
  }) {
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
          body,
          params,
          query,
        }),
      }),
      getHandler: () => "handler",
      getClass: () => "class",
    } as unknown as ExecutionContext;
  }

  function createGuard(
    requirement: unknown,
    records: {
      config?: { projectId: string; project: { organizationId: string } } | null;
      project?: { id: string; organizationId: string } | null;
      segment?: { projectId: string; project: { organizationId: string } } | null;
    },
  ) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(requirement),
    };
    const prisma = {
      config: {
        findUnique: vi.fn().mockResolvedValue(records.config ?? null),
      },
      environment: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      featureFlag: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue(records.project ?? null),
      },
      segment: {
        findUnique: vi.fn().mockResolvedValue(records.segment ?? null),
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
      { project: { id: projectId, organizationId } },
    );

    await expect(guard.canActivate(createContext({ params: { projectId } }))).resolves.toBe(true);
    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      select: { id: true, organizationId: true },
      where: { id: projectId },
    });
  });

  it("hides project resources outside the API token organization", async () => {
    const { guard } = createGuard(
      { projectParam: "projectId" },
      { project: { id: projectId, organizationId: otherOrganizationId } },
    );

    await expect(
      guard.canActivate(createContext({ params: { projectId } })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("hides resources outside a project-scoped API token", async () => {
    const { guard } = createGuard(
      { projectParam: "projectId" },
      { project: { id: otherProjectId, organizationId } },
    );

    await expect(
      guard.canActivate(
        createContext({
          apiToken: { organizationId, projectId },
          params: { projectId: otherProjectId },
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("validates config IDs from request bodies", async () => {
    const { guard, prisma } = createGuard(
      { configBody: "configId" },
      { config: { projectId, project: { organizationId } } },
    );

    await expect(guard.canActivate(createContext({ body: { configId } }))).resolves.toBe(true);
    expect(prisma.config.findUnique).toHaveBeenCalledWith({
      select: { projectId: true, project: { select: { organizationId: true } } },
      where: { id: configId },
    });
  });

  it("hides segment resources outside the API token organization", async () => {
    const { guard } = createGuard(
      { segmentParam: "segmentId" },
      { segment: { projectId, project: { organizationId: otherOrganizationId } } },
    );

    await expect(
      guard.canActivate(createContext({ params: { segmentId } })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects project-scoped API tokens for organization resources", async () => {
    const { guard } = createGuard({ organizationParam: "organizationId" }, {});

    await expect(
      guard.canActivate(
        createContext({
          apiToken: { organizationId, projectId },
          params: { organizationId },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

import { ForbiddenException } from "@nestjs/common";
import type { ApiTokenRequestContext } from "../src/common/authenticated-request";
import { ManagementApiService } from "../src/management-api/management-api.service";

const userId = "user-id";
const organizationId = "organization-id";
const projectId = "project-id";
const otherProjectId = "other-project-id";

describe("ManagementApiService", () => {
  function createService() {
    const projects = {
      create: vi.fn(),
      listForOrganization: vi.fn(),
    };

    return {
      projects,
      service: new ManagementApiService({} as never, projects as never, {} as never, {} as never),
    };
  }

  function apiToken(overrides: Partial<ApiTokenRequestContext> = {}): ApiTokenRequestContext {
    return {
      id: "token-id",
      organizationId,
      projectId: null,
      scopes: [],
      tokenPrefix: "cf_api_prefix",
      userId,
      ...overrides,
    };
  }

  it("returns all organization projects for organization-scoped API tokens", async () => {
    const { projects, service } = createService();
    const organizationProjects = [{ id: projectId }, { id: otherProjectId }];
    projects.listForOrganization.mockResolvedValue(organizationProjects);

    await expect(service.listProjects(userId, apiToken())).resolves.toEqual(organizationProjects);
    expect(projects.listForOrganization).toHaveBeenCalledWith(userId, organizationId);
  });

  it("filters listed projects for project-scoped API tokens", async () => {
    const { projects, service } = createService();
    projects.listForOrganization.mockResolvedValue([{ id: projectId }, { id: otherProjectId }]);

    await expect(service.listProjects(userId, apiToken({ projectId }))).resolves.toEqual([
      { id: projectId },
    ]);
  });

  it("rejects project creation from project-scoped API tokens", () => {
    const { projects, service } = createService();

    expect(() =>
      service.createProject(userId, apiToken({ projectId }), { name: "Project", slug: "project" }),
    ).toThrow(ForbiddenException);
    expect(projects.create).not.toHaveBeenCalled();
  });
});

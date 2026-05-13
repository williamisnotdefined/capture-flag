import { ForbiddenException } from "@nestjs/common";
import { AccessService } from "../src/common/access.service";

describe("AccessService", () => {
  it("does not allow project_admin when no project role is allowed", async () => {
    const prisma = {
      organizationMember: {
        findUnique: vi.fn().mockResolvedValue({ role: "member" }),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue({
          id: "project-id",
          name: "Project",
          organizationId: "organization-id",
          slug: "project",
        }),
      },
      projectMember: {
        findUnique: vi.fn().mockResolvedValue({ role: "project_admin" }),
      },
    };
    const service = new AccessService(prisma as never);

    await expect(service.requireProjectRole("user-id", "project-id", [])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

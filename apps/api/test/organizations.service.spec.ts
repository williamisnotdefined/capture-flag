import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { OrganizationsService } from "../src/organizations/organizations.service";

describe("OrganizationsService", () => {
  function createService() {
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      organizationMember: {
        count: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      user: {
        findUnique: vi.fn(),
      },
    };
    const access = {
      requireOrganizationRole: vi.fn(),
    };

    return {
      access,
      prisma,
      service: new OrganizationsService(prisma as never, access as never),
      tx,
    };
  }

  it("prevents admins from creating organization owners", async () => {
    const { access, prisma, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "admin" });
    prisma.user.findUnique.mockResolvedValue({ id: "target-user-id" });
    tx.organizationMember.findUnique.mockResolvedValue(null);

    await expect(
      service.addMember("actor-user-id", "organization-id", {
        email: "target@example.com",
        role: "owner",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.organizationMember.upsert).not.toHaveBeenCalled();
  });

  it("prevents removing the last organization owner", async () => {
    const { access, prisma, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    prisma.user.findUnique.mockResolvedValue({ id: "target-user-id" });
    tx.organizationMember.findUnique.mockResolvedValue({ role: "owner" });
    tx.organizationMember.count.mockResolvedValue(1);

    await expect(
      service.addMember("actor-user-id", "organization-id", {
        email: "target@example.com",
        role: "admin",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.organizationMember.upsert).not.toHaveBeenCalled();
  });

  it("requires exactly one member target", async () => {
    const { access, prisma, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });

    await expect(
      service.addMember("actor-user-id", "organization-id", {
        email: "target@example.com",
        role: "member",
        userId: "target-user-id",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(tx.organizationMember.upsert).not.toHaveBeenCalled();
  });

  it("audits organization member additions", async () => {
    const { access, prisma, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    prisma.user.findUnique.mockResolvedValue({ id: "target-user-id" });
    tx.organizationMember.findUnique.mockResolvedValue(null);
    tx.organizationMember.upsert.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "member",
      userId: "target-user-id",
    });

    await service.addMember("actor-user-id", "organization-id", {
      email: "target@example.com",
      role: "member",
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "organization_member.added",
        actorUserId: "actor-user-id",
        entityId: "member-id",
        entityType: "organization_member",
        organizationId: "organization-id",
      }),
    });
  });
});

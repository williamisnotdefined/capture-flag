import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { OrganizationsService } from "../src/organizations/organizations.service";
import {
  OrganizationMemberAccessService,
  OrganizationMemberAuditService,
  OrganizationMemberTargetService,
} from "../src/organizations/support";
import {
  AddOrganizationMemberService,
  BulkDeleteOrganizationsService,
  BulkRemoveOrganizationMembersService,
  CreateOrganizationService,
  DeleteOrganizationService,
  GetOrganizationService,
  ListOrganizationMembersService,
  ListUserOrganizationsService,
  RemoveOrganizationMemberService,
  UpdateOrganizationMemberService,
  UpdateOrganizationService,
} from "../src/organizations/use-cases";

function createOrganizationsService(prisma: unknown, access: unknown) {
  const organizationMemberAccess = new OrganizationMemberAccessService(access as never);
  const organizationMemberAudit = new OrganizationMemberAuditService();
  const organizationMemberTarget = new OrganizationMemberTargetService(prisma as never);

  return new OrganizationsService(
    new ListUserOrganizationsService(prisma as never),
    new CreateOrganizationService(prisma as never),
    new GetOrganizationService(prisma as never, organizationMemberAccess),
    new ListOrganizationMembersService(prisma as never, organizationMemberAccess),
    new AddOrganizationMemberService(
      prisma as never,
      organizationMemberAccess,
      organizationMemberAudit,
      organizationMemberTarget,
    ),
    new UpdateOrganizationMemberService(
      prisma as never,
      organizationMemberAccess,
      organizationMemberAudit,
    ),
    new RemoveOrganizationMemberService(
      prisma as never,
      organizationMemberAccess,
      organizationMemberAudit,
    ),
    new UpdateOrganizationService(prisma as never, access as never),
    new DeleteOrganizationService(prisma as never, access as never),
    new BulkDeleteOrganizationsService(prisma as never, access as never),
    new BulkRemoveOrganizationMembersService(
      prisma as never,
      organizationMemberAccess,
      organizationMemberAudit,
    ),
  );
}

describe("OrganizationsService", () => {
  function createService() {
    const tx = {
      auditLog: {
        create: vi.fn(),
      },
      organization: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      organizationMember: {
        create: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback(tx)),
      organization: {
        findUnique: vi.fn(),
      },
      organizationMember: {
        findMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };
    const access = {
      requireOrganizationMember: vi.fn(),
      requireOrganizationRole: vi.fn(),
    };

    return {
      access,
      prisma,
      service: createOrganizationsService(prisma, access),
      tx,
    };
  }

  it("lists user organizations with a minimal select", async () => {
    const { prisma, service } = createService();
    const createdAt = new Date("2026-05-12T00:00:00.000Z");
    prisma.organizationMember.findMany.mockResolvedValue([
      {
        role: "owner",
        organization: {
          id: "organization-id",
          _count: {
            members: 2,
            projects: 1,
          },
          name: "Organization",
          slug: "organization",
          createdAt,
        },
      },
    ]);

    const result = await service.listForUser("user-id");

    const query = prisma.organizationMember.findMany.mock.calls[0][0];
    expect(query).not.toHaveProperty("include");
    expect(query).toEqual({
      where: { userId: "user-id", organization: { deletedAt: null } },
      select: {
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
                projects: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual([
      {
        id: "organization-id",
        memberCount: 2,
        name: "Organization",
        projectCount: 1,
        slug: "organization",
        role: "owner",
        createdAt,
      },
    ]);
  });

  it("lists organization members after checking membership", async () => {
    const { access, prisma, service } = createService();
    access.requireOrganizationMember.mockResolvedValue({ role: "member" });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    await service.listMembers("user-id", "organization-id");

    expect(access.requireOrganizationMember).toHaveBeenCalledWith("user-id", "organization-id");
    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith({
      where: { organizationId: "organization-id" },
      include: expect.any(Object),
      orderBy: { createdAt: "asc" },
    });
  });

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

  it("does not audit member additions when the role is unchanged", async () => {
    const { access, prisma, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    prisma.user.findUnique.mockResolvedValue({ id: "target-user-id" });
    tx.organizationMember.findUnique
      .mockResolvedValueOnce({
        id: "member-id",
        organizationId: "organization-id",
        role: "member",
        userId: "target-user-id",
      })
      .mockResolvedValueOnce({
        id: "member-id",
        organizationId: "organization-id",
        role: "member",
        userId: "target-user-id",
      });

    await service.addMember("actor-user-id", "organization-id", {
      email: "target@example.com",
      role: "member",
    });

    expect(tx.organizationMember.upsert).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("audits organization member role updates", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    tx.organizationMember.findFirst.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "member",
      userId: "target-user-id",
    });
    tx.organizationMember.update.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "admin",
      userId: "target-user-id",
    });

    await service.updateMember("actor-user-id", "organization-id", "member-id", {
      role: "admin",
    });

    expect(tx.organizationMember.update).toHaveBeenCalledWith({
      where: { id: "member-id" },
      data: { role: "admin" },
      include: expect.any(Object),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "organization_member.updated",
        actorUserId: "actor-user-id",
        entityId: "member-id",
        entityType: "organization_member",
        organizationId: "organization-id",
      }),
    });
  });

  it("does not audit organization member updates when the role is unchanged", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    tx.organizationMember.findFirst.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "member",
      userId: "target-user-id",
    });
    tx.organizationMember.findUnique.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "member",
      userId: "target-user-id",
    });

    await service.updateMember("actor-user-id", "organization-id", "member-id", {
      role: "member",
    });

    expect(tx.organizationMember.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("prevents admins from changing organization owners", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "admin" });
    tx.organizationMember.findFirst.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "owner",
      userId: "target-user-id",
    });

    await expect(
      service.updateMember("actor-user-id", "organization-id", "member-id", {
        role: "admin",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.organizationMember.update).not.toHaveBeenCalled();
  });

  it("prevents removing the last organization owner", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    tx.organizationMember.findFirst.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "owner",
      userId: "target-user-id",
    });
    tx.organizationMember.count.mockResolvedValue(1);

    await expect(
      service.removeMember("actor-user-id", "organization-id", "member-id"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.organizationMember.delete).not.toHaveBeenCalled();
  });

  it("audits organization member removals", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    tx.organizationMember.findFirst.mockResolvedValue({
      id: "member-id",
      organizationId: "organization-id",
      role: "member",
      userId: "target-user-id",
    });
    tx.organizationMember.delete.mockResolvedValue({});

    await service.removeMember("actor-user-id", "organization-id", "member-id");

    expect(tx.organizationMember.delete).toHaveBeenCalledWith({ where: { id: "member-id" } });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "organization_member.removed",
        actorUserId: "actor-user-id",
        entityId: "member-id",
        entityType: "organization_member",
        organizationId: "organization-id",
      }),
    });
  });

  it("bulk soft deletes organizations after checking owner access for every organization", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    tx.organization.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      service.bulkDelete("actor-user-id", ["organization-1", "organization-2"]),
    ).resolves.toEqual({
      count: 2,
      ok: true,
    });

    expect(access.requireOrganizationRole).toHaveBeenCalledWith("actor-user-id", "organization-1", [
      "owner",
    ]);
    expect(access.requireOrganizationRole).toHaveBeenCalledWith("actor-user-id", "organization-2", [
      "owner",
    ]);
    expect(tx.organization.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["organization-1", "organization-2"] }, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("prevents bulk removing every organization owner", async () => {
    const { access, service, tx } = createService();
    access.requireOrganizationRole.mockResolvedValue({ role: "owner" });
    tx.organizationMember.findMany.mockResolvedValue([
      { id: "owner-1", organizationId: "organization-id", role: "owner", userId: "user-1" },
      { id: "owner-2", organizationId: "organization-id", role: "owner", userId: "user-2" },
    ]);
    tx.organizationMember.count.mockResolvedValue(2);

    await expect(
      service.bulkRemoveMembers("actor-user-id", "organization-id", ["owner-1", "owner-2"]),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.organizationMember.deleteMany).not.toHaveBeenCalled();
  });
});

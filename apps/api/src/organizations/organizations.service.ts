import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { isOrganizationRole, organizationManagerRoles } from "../common/roles";
import { requireSlug } from "../common/slug";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      createdAt: membership.organization.createdAt,
    }));
  }

  async create(userId: string, input: { name?: string; slug?: string }) {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Organization name is required");
    }

    const slug = requireSlug(input.slug ?? name, "organization");

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: "owner",
        },
      });

      return {
        ...organization,
        role: "owner",
      };
    });
  }

  async get(userId: string, organizationId: string) {
    const membership = await this.access.requireOrganizationMember(userId, organizationId);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return {
      ...organization,
      role: membership.role,
    };
  }

  async listMembers(userId: string, organizationId: string) {
    await this.access.requireOrganizationMember(userId, organizationId);

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addMember(
    actorUserId: string,
    organizationId: string,
    input: { userId?: string; email?: string; role?: string },
  ) {
    const actorMembership = await this.access.requireOrganizationRole(
      actorUserId,
      organizationId,
      organizationManagerRoles,
    );

    if (!isOrganizationRole(input.role)) {
      throw new BadRequestException("Valid organization role is required");
    }
    const role = input.role;

    const user = await this.findTargetUser(input);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: user.id,
          },
        },
      });

      if (
        actorMembership.role === "admin" &&
        (role === "owner" || existingMembership?.role === "owner")
      ) {
        throw new ForbiddenException("Admins cannot create or change organization owners");
      }

      if (existingMembership?.role === "owner" && role !== "owner") {
        const ownerCount = await tx.organizationMember.count({
          where: {
            organizationId,
            role: "owner",
          },
        });

        if (ownerCount <= 1) {
          throw new BadRequestException("Organization must keep at least one owner");
        }
      }

      if (existingMembership?.role === role) {
        return tx.organizationMember.findUnique({
          where: { id: existingMembership.id },
          include: this.organizationMemberInclude(),
        });
      }

      const membership = await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId,
            userId: user.id,
          },
        },
        create: {
          organizationId,
          userId: user.id,
          role,
        },
        update: {
          role,
        },
        include: this.organizationMemberInclude(),
      });

      await createAuditLog(tx, {
        action: existingMembership ? "organization_member.updated" : "organization_member.added",
        actorUserId,
        entityId: membership.id,
        entityType: "organization_member",
        metadata: toAuditJson({ targetUserId: user.id }),
        newValue: this.organizationMemberAuditValue(membership),
        oldValue: existingMembership
          ? this.organizationMemberAuditValue(existingMembership)
          : undefined,
        organizationId,
      });

      return membership;
    });
  }

  async updateMember(
    actorUserId: string,
    organizationId: string,
    memberId: string,
    input: { role?: string },
  ) {
    const actorMembership = await this.access.requireOrganizationRole(
      actorUserId,
      organizationId,
      organizationManagerRoles,
    );

    if (!isOrganizationRole(input.role)) {
      throw new BadRequestException("Valid organization role is required");
    }
    const role = input.role;

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.findFirst({
        where: {
          id: memberId,
          organizationId,
        },
        select: { id: true, organizationId: true, role: true, userId: true },
      });
      if (!member) {
        throw new NotFoundException("Organization member not found");
      }

      this.assertCanChangeMemberRole(actorMembership.role, member.role, role);

      if (member.role === role) {
        return tx.organizationMember.findUnique({
          where: { id: memberId },
          include: this.organizationMemberInclude(),
        });
      }

      if (member.role === "owner") {
        await this.ensureOrganizationKeepsOwner(tx, organizationId);
      }

      const updatedMember = await tx.organizationMember.update({
        where: { id: memberId },
        data: { role },
        include: this.organizationMemberInclude(),
      });

      await createAuditLog(tx, {
        action: "organization_member.updated",
        actorUserId,
        entityId: memberId,
        entityType: "organization_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        newValue: this.organizationMemberAuditValue(updatedMember),
        oldValue: this.organizationMemberAuditValue(member),
        organizationId,
      });

      return updatedMember;
    });
  }

  async removeMember(actorUserId: string, organizationId: string, memberId: string) {
    const actorMembership = await this.access.requireOrganizationRole(
      actorUserId,
      organizationId,
      organizationManagerRoles,
    );

    await this.prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.findFirst({
        where: {
          id: memberId,
          organizationId,
        },
        select: { id: true, organizationId: true, role: true, userId: true },
      });
      if (!member) {
        throw new NotFoundException("Organization member not found");
      }

      if (actorMembership.role === "admin" && member.role === "owner") {
        throw new ForbiddenException("Admins cannot remove organization owners");
      }

      if (member.role === "owner") {
        await this.ensureOrganizationKeepsOwner(tx, organizationId);
      }

      await tx.organizationMember.delete({ where: { id: memberId } });

      await createAuditLog(tx, {
        action: "organization_member.removed",
        actorUserId,
        entityId: memberId,
        entityType: "organization_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        oldValue: this.organizationMemberAuditValue(member),
        organizationId,
      });
    });

    return { ok: true };
  }

  private async findTargetUser(input: { userId?: string; email?: string }) {
    const userId = input.userId?.trim();
    const email = input.email?.trim().toLowerCase();

    if (userId && email) {
      throw new BadRequestException("Provide exactly one of userId or email");
    }

    if (userId) {
      return this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (email) {
      return this.prisma.user.findUnique({ where: { email } });
    }

    throw new BadRequestException("userId or email is required");
  }

  private assertCanChangeMemberRole(actorRole: string, currentRole: string, nextRole: string) {
    if (actorRole === "admin" && (nextRole === "owner" || currentRole === "owner")) {
      throw new ForbiddenException("Admins cannot create or change organization owners");
    }
  }

  private async ensureOrganizationKeepsOwner(
    tx: Pick<PrismaService, "organizationMember">,
    organizationId: string,
  ) {
    const ownerCount = await tx.organizationMember.count({
      where: {
        organizationId,
        role: "owner",
      },
    });

    if (ownerCount <= 1) {
      throw new BadRequestException("Organization must keep at least one owner");
    }
  }

  private organizationMemberInclude() {
    return {
      user: {
        select: {
          avatarUrl: true,
          email: true,
          id: true,
          name: true,
        },
      },
    } as const;
  }

  private organizationMemberAuditValue(member: {
    id: string;
    organizationId: string;
    role: string;
    userId: string;
  }) {
    return toAuditJson({
      id: member.id,
      organizationId: member.organizationId,
      role: member.role,
      userId: member.userId,
    });
  }
}

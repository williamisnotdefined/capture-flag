import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { isOrganizationRole } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import {
  OrganizationMemberAccessService,
  OrganizationMemberAuditService,
  OrganizationMemberTargetService,
  organizationMemberInclude,
} from "../support";

export type AddOrganizationMemberInput = {
  actorUserId: string;
  input: {
    email?: string;
    role?: string;
    userId?: string;
  };
  organizationId: string;
};

@Injectable()
export class AddOrganizationMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationMemberAccess: OrganizationMemberAccessService,
    private readonly organizationMemberAudit: OrganizationMemberAuditService,
    private readonly organizationMemberTarget: OrganizationMemberTargetService,
  ) {}

  async execute({ actorUserId, organizationId, input }: AddOrganizationMemberInput) {
    const actorMembership = await this.organizationMemberAccess.requireOrganizationManager(
      actorUserId,
      organizationId,
    );

    if (!isOrganizationRole(input.role)) {
      throw new BadRequestException("Valid organization role is required");
    }
    const role = input.role;

    const user = await this.organizationMemberTarget.findTargetUser(input);
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

      this.organizationMemberAccess.assertCanAddMemberRole(
        actorMembership.role,
        existingMembership?.role,
        role,
      );

      if (existingMembership?.role === "owner" && role !== "owner") {
        await this.organizationMemberAccess.ensureOrganizationKeepsOwner(tx, organizationId);
      }

      if (existingMembership?.role === role) {
        return tx.organizationMember.findUnique({
          where: { id: existingMembership.id },
          include: organizationMemberInclude(),
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
        include: organizationMemberInclude(),
      });

      await createAuditLog(tx, {
        action: existingMembership ? "organization_member.updated" : "organization_member.added",
        actorUserId,
        entityId: membership.id,
        entityType: "organization_member",
        metadata: toAuditJson({ targetUserId: user.id }),
        newValue: this.organizationMemberAudit.organizationMemberAuditValue(membership),
        oldValue: existingMembership
          ? this.organizationMemberAudit.organizationMemberAuditValue(existingMembership)
          : undefined,
        organizationId,
      });

      return membership;
    });
  }
}

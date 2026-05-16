import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { isOrganizationRole } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import {
  OrganizationMemberAccessService,
  OrganizationMemberAuditService,
  organizationMemberInclude,
} from "../support";

export type UpdateOrganizationMemberInput = {
  actorUserId: string;
  input: {
    role?: string;
  };
  memberId: string;
  organizationId: string;
};

@Injectable()
export class UpdateOrganizationMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationMemberAccess: OrganizationMemberAccessService,
    private readonly organizationMemberAudit: OrganizationMemberAuditService,
  ) {}

  async execute({ actorUserId, organizationId, memberId, input }: UpdateOrganizationMemberInput) {
    const actorMembership = await this.organizationMemberAccess.requireOrganizationManager(
      actorUserId,
      organizationId,
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

      this.organizationMemberAccess.assertCanChangeMemberRole(
        actorMembership.role,
        member.role,
        role,
      );

      if (member.role === role) {
        return tx.organizationMember.findUnique({
          where: { id: memberId },
          include: organizationMemberInclude(),
        });
      }

      if (member.role === "owner") {
        await this.organizationMemberAccess.ensureOrganizationKeepsOwner(tx, organizationId);
      }

      const updatedMember = await tx.organizationMember.update({
        where: { id: memberId },
        data: { role },
        include: organizationMemberInclude(),
      });

      await createAuditLog(tx, {
        action: "organization_member.updated",
        actorUserId,
        entityId: memberId,
        entityType: "organization_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        newValue: this.organizationMemberAudit.organizationMemberAuditValue(updatedMember),
        oldValue: this.organizationMemberAudit.organizationMemberAuditValue(member),
        organizationId,
      });

      return updatedMember;
    });
  }
}

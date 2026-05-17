import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationMemberAccessService, OrganizationMemberAuditService } from "../support";

export type BulkRemoveOrganizationMembersInput = {
  actorUserId: string;
  memberIds: string[];
  organizationId: string;
};

@Injectable()
export class BulkRemoveOrganizationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationMemberAccess: OrganizationMemberAccessService,
    private readonly organizationMemberAudit: OrganizationMemberAuditService,
  ) {}

  async execute({ actorUserId, organizationId, memberIds }: BulkRemoveOrganizationMembersInput) {
    const actorMembership = await this.organizationMemberAccess.requireOrganizationManager(
      actorUserId,
      organizationId,
    );

    await this.prisma.$transaction(async (tx) => {
      const members = await tx.organizationMember.findMany({
        where: {
          id: { in: memberIds },
          organizationId,
        },
        select: { id: true, organizationId: true, role: true, userId: true },
      });

      if (members.length !== memberIds.length) {
        throw new NotFoundException("Organization member not found");
      }

      for (const member of members) {
        this.organizationMemberAccess.assertCanRemoveMember(actorMembership.role, member.role);
      }

      const removedOwnerCount = members.filter((member) => member.role === "owner").length;
      if (removedOwnerCount > 0) {
        const ownerCount = await tx.organizationMember.count({
          where: { organizationId, role: "owner" },
        });

        if (ownerCount - removedOwnerCount < 1) {
          throw new BadRequestException("Organization must keep at least one owner");
        }
      }

      const deleteResult = await tx.organizationMember.deleteMany({
        where: { id: { in: memberIds }, organizationId },
      });

      if (deleteResult.count !== memberIds.length) {
        throw new NotFoundException("Organization member not found");
      }

      for (const member of members) {
        await createAuditLog(tx, {
          action: "organization_member.removed",
          actorUserId,
          entityId: member.id,
          entityType: "organization_member",
          metadata: toAuditJson({ targetUserId: member.userId }),
          oldValue: this.organizationMemberAudit.organizationMemberAuditValue(member),
          organizationId,
        });
      }
    });

    return { ok: true, count: memberIds.length };
  }
}

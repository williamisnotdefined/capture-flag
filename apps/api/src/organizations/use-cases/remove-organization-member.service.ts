import { Injectable, NotFoundException } from "@nestjs/common";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationMemberAccessService, OrganizationMemberAuditService } from "../support";

export type RemoveOrganizationMemberInput = {
  actorUserId: string;
  memberId: string;
  organizationId: string;
};

@Injectable()
export class RemoveOrganizationMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationMemberAccess: OrganizationMemberAccessService,
    private readonly organizationMemberAudit: OrganizationMemberAuditService,
  ) {}

  async execute({ actorUserId, organizationId, memberId }: RemoveOrganizationMemberInput) {
    const actorMembership = await this.organizationMemberAccess.requireOrganizationManager(
      actorUserId,
      organizationId,
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

      this.organizationMemberAccess.assertCanRemoveMember(actorMembership.role, member.role);

      if (member.role === "owner") {
        await this.organizationMemberAccess.ensureOrganizationKeepsOwner(tx, organizationId);
      }

      await tx.organizationMember.delete({ where: { id: memberId } });

      await createAuditLog(tx, {
        action: "organization_member.removed",
        actorUserId,
        entityId: memberId,
        entityType: "organization_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        oldValue: this.organizationMemberAudit.organizationMemberAuditValue(member),
        organizationId,
      });
    });

    return { ok: true };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectAuditService } from "../support";

export type BulkRemoveProjectMembersInput = {
  actorUserId: string;
  memberIds: string[];
  projectId: string;
};

@Injectable()
export class BulkRemoveProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly projectAudit: ProjectAuditService,
  ) {}

  async execute({ actorUserId, projectId, memberIds }: BulkRemoveProjectMembersInput) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    await this.prisma.$transaction(async (tx) => {
      const members = await tx.projectMember.findMany({
        where: {
          id: { in: memberIds },
          projectId,
        },
        select: { id: true, projectId: true, role: true, userId: true },
      });

      if (members.length !== memberIds.length) {
        throw new NotFoundException("Project member not found");
      }

      const deleteResult = await tx.projectMember.deleteMany({
        where: { id: { in: memberIds }, projectId },
      });

      if (deleteResult.count !== memberIds.length) {
        throw new NotFoundException("Project member not found");
      }

      for (const member of members) {
        await createAuditLog(tx, {
          action: "project_member.removed",
          actorUserId,
          entityId: member.id,
          entityType: "project_member",
          metadata: toAuditJson({ targetUserId: member.userId }),
          oldValue: this.projectAudit.projectMemberAuditValue(member),
          organizationId: access.project.organizationId,
          projectId,
        });
      }
    });

    return { ok: true, count: memberIds.length };
  }
}

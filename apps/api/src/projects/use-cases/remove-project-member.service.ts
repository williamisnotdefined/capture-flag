import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectAuditService } from "../support";

export type RemoveProjectMemberInput = {
  actorUserId: string;
  memberId: string;
  projectId: string;
};

@Injectable()
export class RemoveProjectMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly projectAudit: ProjectAuditService,
  ) {}

  async execute({ actorUserId, projectId, memberId }: RemoveProjectMemberInput) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    const member = await this.prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      select: { id: true, projectId: true, role: true, userId: true },
    });
    if (!member) {
      throw new NotFoundException("Project member not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({ where: { id: memberId } });

      await createAuditLog(tx, {
        action: "project_member.removed",
        actorUserId,
        entityId: memberId,
        entityType: "project_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        oldValue: this.projectAudit.projectMemberAuditValue(member),
        organizationId: access.project.organizationId,
        projectId,
      });
    });

    return { ok: true };
  }
}

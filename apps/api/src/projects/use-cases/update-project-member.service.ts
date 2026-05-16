import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { isProjectRole, projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectAuditService, projectMemberSelect } from "../support";

export type UpdateProjectMemberInput = {
  actorUserId: string;
  input: { role?: string };
  memberId: string;
  projectId: string;
};

@Injectable()
export class UpdateProjectMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly projectAudit: ProjectAuditService,
  ) {}

  async execute({ actorUserId, projectId, memberId, input }: UpdateProjectMemberInput) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    if (!isProjectRole(input.role)) {
      throw new BadRequestException("Valid project role is required");
    }

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

    if (member.role === input.role) {
      return this.prisma.projectMember.findUnique({
        where: { id: memberId },
        select: projectMemberSelect(),
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedMember = await tx.projectMember.update({
        where: { id: memberId },
        data: { role: input.role },
        select: projectMemberSelect(),
      });

      await createAuditLog(tx, {
        action: "project_member.updated",
        actorUserId,
        entityId: memberId,
        entityType: "project_member",
        metadata: toAuditJson({ targetUserId: member.userId }),
        newValue: this.projectAudit.projectMemberAuditValue(updatedMember),
        oldValue: this.projectAudit.projectMemberAuditValue(member),
        organizationId: access.project.organizationId,
        projectId,
      });

      return updatedMember;
    });
  }
}

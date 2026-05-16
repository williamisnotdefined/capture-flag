import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { isProjectRole, projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectAuditService, ProjectMemberSupportService } from "../support";

export type AddProjectMemberInput = {
  actorUserId: string;
  input: { userId?: string; email?: string; role?: string };
  projectId: string;
};

@Injectable()
export class AddProjectMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly projectAudit: ProjectAuditService,
    private readonly projectMemberSupport: ProjectMemberSupportService,
  ) {}

  async execute({ actorUserId, projectId, input }: AddProjectMemberInput) {
    const access = await this.access.requireProjectRole(
      actorUserId,
      projectId,
      projectManagerRoles,
    );

    if (!isProjectRole(input.role)) {
      throw new BadRequestException("Valid project role is required");
    }
    const role = input.role;

    const user = await this.projectMemberSupport.findTargetUser(input);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.access.requireOrganizationMember(user.id, access.project.organizationId);

    return this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (existingMembership?.role === role) {
        return tx.projectMember.findUnique({
          where: { id: existingMembership.id },
          include: this.projectMemberSupport.projectMemberInclude(),
        });
      }

      const member = await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
        create: {
          projectId,
          userId: user.id,
          role,
        },
        update: {
          role,
        },
        include: this.projectMemberSupport.projectMemberInclude(),
      });

      await createAuditLog(tx, {
        action: existingMembership ? "project_member.updated" : "project_member.added",
        actorUserId,
        entityId: member.id,
        entityType: "project_member",
        metadata: toAuditJson({ targetUserId: user.id }),
        newValue: this.projectAudit.projectMemberAuditValue(member),
        oldValue: existingMembership
          ? this.projectAudit.projectMemberAuditValue(existingMembership)
          : undefined,
        organizationId: access.project.organizationId,
        projectId,
      });

      return member;
    });
  }
}

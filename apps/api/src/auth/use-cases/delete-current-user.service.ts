import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createAuditLog, toAuditJson } from "../../common/audit-log";
import { PrismaService } from "../../prisma/prisma.service";

export type DeleteCurrentUserInput = {
  userId: string;
};

const deletedUserName = "Conta excluida";

@Injectable()
export class DeleteCurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ userId }: DeleteCurrentUserInput) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      await this.ensureUserCanBeDeleted(tx, userId);

      const deletedAt = new Date();
      const [organizationMemberships, projectMemberships] = await Promise.all([
        tx.organizationMember.findMany({
          where: { userId },
          select: { id: true, organizationId: true, role: true, userId: true },
        }),
        tx.projectMember.findMany({
          where: { userId },
          select: {
            id: true,
            projectId: true,
            role: true,
            userId: true,
            project: {
              select: {
                organizationId: true,
              },
            },
          },
        }),
      ]);

      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt,
          email: null,
          name: deletedUserName,
        },
      });

      await Promise.all([
        tx.session.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: deletedAt },
        }),
        tx.apiToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: deletedAt },
        }),
        tx.oAuthAccount.deleteMany({ where: { userId } }),
      ]);

      for (const membership of projectMemberships) {
        await createAuditLog(tx, {
          action: "project_member.removed",
          actorUserId: userId,
          entityId: membership.id,
          entityType: "project_member",
          metadata: toAuditJson({ reason: "user_deleted", targetUserId: userId }),
          oldValue: toAuditJson({
            id: membership.id,
            projectId: membership.projectId,
            role: membership.role,
            userId: membership.userId,
          }),
          organizationId: membership.project.organizationId,
          projectId: membership.projectId,
        });
      }

      for (const membership of organizationMemberships) {
        await createAuditLog(tx, {
          action: "organization_member.removed",
          actorUserId: userId,
          entityId: membership.id,
          entityType: "organization_member",
          metadata: toAuditJson({ reason: "user_deleted", targetUserId: userId }),
          oldValue: toAuditJson({
            id: membership.id,
            organizationId: membership.organizationId,
            role: membership.role,
            userId: membership.userId,
          }),
          organizationId: membership.organizationId,
        });
      }

      await Promise.all([
        tx.projectMember.deleteMany({ where: { userId } }),
        tx.organizationMember.deleteMany({ where: { userId } }),
      ]);
    });

    return { ok: true };
  }

  private async ensureUserCanBeDeleted(tx: Prisma.TransactionClient, userId: string) {
    const ownerMemberships = await tx.organizationMember.findMany({
      where: {
        role: "owner",
        userId,
        organization: {
          deletedAt: null,
        },
      },
      select: {
        organizationId: true,
      },
    });

    for (const membership of ownerMemberships) {
      const ownerCount = await tx.organizationMember.count({
        where: {
          organizationId: membership.organizationId,
          role: "owner",
          user: {
            deletedAt: null,
          },
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException("Organization must keep at least one owner");
      }
    }
  }
}

import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { organizationManagerRoles } from "../../common/roles";
import type { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrganizationMemberAccessService {
  constructor(private readonly access: AccessService) {}

  requireOrganizationMember(userId: string, organizationId: string) {
    return this.access.requireOrganizationMember(userId, organizationId);
  }

  requireOrganizationManager(userId: string, organizationId: string) {
    return this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);
  }

  assertCanAddMemberRole(actorRole: string, existingRole: string | undefined, nextRole: string) {
    if (actorRole === "admin" && (nextRole === "owner" || existingRole === "owner")) {
      throw new ForbiddenException("Admins cannot create or change organization owners");
    }
  }

  assertCanChangeMemberRole(actorRole: string, currentRole: string, nextRole: string) {
    if (actorRole === "admin" && (nextRole === "owner" || currentRole === "owner")) {
      throw new ForbiddenException("Admins cannot create or change organization owners");
    }
  }

  assertCanRemoveMember(actorRole: string, memberRole: string) {
    if (actorRole === "admin" && memberRole === "owner") {
      throw new ForbiddenException("Admins cannot remove organization owners");
    }
  }

  async ensureOrganizationKeepsOwner(
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
}

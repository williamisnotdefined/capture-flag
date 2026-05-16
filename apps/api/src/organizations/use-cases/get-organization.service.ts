import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationMemberAccessService, organizationSelect } from "../support";

export type GetOrganizationInput = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class GetOrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationMemberAccess: OrganizationMemberAccessService,
  ) {}

  async execute({ userId, organizationId }: GetOrganizationInput) {
    const membership = await this.organizationMemberAccess.requireOrganizationMember(
      userId,
      organizationId,
    );
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: organizationSelect(),
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const { _count, ...organizationFields } = organization;

    return {
      ...organizationFields,
      role: membership.role,
      memberCount: _count?.members ?? 0,
      projectCount: _count?.projects ?? 0,
    };
  }
}

import { BadRequestException, Injectable } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { organizationManagerRoles } from "../../common/roles";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";
import { organizationSelect } from "../support";

export type UpdateOrganizationInput = {
  input: { name?: string; slug?: string };
  organizationId: string;
  userId: string;
};

@Injectable()
export class UpdateOrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async execute({ userId, organizationId, input }: UpdateOrganizationInput) {
    const membership = await this.access.requireOrganizationRole(
      userId,
      organizationId,
      organizationManagerRoles,
    );
    const data: { name?: string; slug?: string } = {};

    if (input.name?.trim()) {
      data.name = input.name.trim();
    }

    if (input.slug?.trim()) {
      data.slug = requireSlug(input.slug, "organization");
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No organization fields to update");
    }

    const updatedOrganization = await this.prisma.organization.update({
      where: { id: organizationId },
      data,
      select: organizationSelect(),
    });
    const { _count, ...organizationFields } = updatedOrganization;

    return {
      ...organizationFields,
      role: membership.role,
      memberCount: _count?.members ?? 0,
      projectCount: _count?.projects ?? 0,
    };
  }
}

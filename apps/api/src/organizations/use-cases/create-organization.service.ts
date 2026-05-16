import { BadRequestException, Injectable } from "@nestjs/common";
import { requireSlug } from "../../common/slug";
import { PrismaService } from "../../prisma/prisma.service";

export type CreateOrganizationInput = {
  input: {
    name?: string;
    slug?: string;
  };
  userId: string;
};

@Injectable()
export class CreateOrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ userId, input }: CreateOrganizationInput) {
    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("Organization name is required");
    }

    const slug = requireSlug(input.slug ?? name, "organization");

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: "owner",
        },
      });

      return {
        ...organization,
        role: "owner",
      };
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { isFeatureFlagType } from "../../common/flag-values";
import { featureFlagManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

const flagKeyPattern = /^[A-Za-z][A-Za-z0-9_.-]*$/;

@Injectable()
export class FeatureFlagAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async findConfigForRead(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      select: { projectId: true },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectAccess(userId, config.projectId);
    return config;
  }

  async findConfigForCreate(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, featureFlagManagerRoles);
    return config;
  }

  async findConfigForWrite(userId: string, configId: string) {
    const config = await this.prisma.config.findUnique({
      where: { id: configId },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    await this.access.requireProjectRole(userId, config.projectId, featureFlagManagerRoles);
    return config;
  }

  async findActiveFlag(configId: string, featureFlagId: string) {
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        configId,
        id: featureFlagId,
        deletedAt: null,
      },
    });

    if (!flag) {
      throw new NotFoundException("Feature flag not found");
    }
    if (!isFeatureFlagType(flag.type)) {
      throw new BadRequestException("Feature flag has an invalid type");
    }

    return flag;
  }

  normalizeFlagKey(value: string | undefined) {
    const key = value?.trim();
    if (!key) {
      throw new BadRequestException("Flag key is required");
    }

    if (!flagKeyPattern.test(key)) {
      throw new BadRequestException(
        "Flag key must start with a letter and contain only letters, numbers, dots, underscores or hyphens",
      );
    }

    return key;
  }

  async normalizeOwnerUserId(ownerUserId: string | null | undefined, organizationId: string) {
    if (!ownerUserId) {
      return null;
    }

    await this.access.requireOrganizationMember(ownerUserId, organizationId);
    return ownerUserId;
  }
}

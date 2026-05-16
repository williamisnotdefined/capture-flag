import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { segmentManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SegmentAccessService {
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

    await this.access.requireProjectRole(userId, config.projectId, segmentManagerRoles);
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

    await this.access.requireProjectRole(userId, config.projectId, segmentManagerRoles);
    return config;
  }

  async findActiveSegment(configId: string, segmentId: string) {
    const segment = await this.prisma.segment.findFirst({
      where: {
        configId,
        id: segmentId,
        deletedAt: null,
      },
    });

    if (!segment) {
      throw new NotFoundException("Segment not found");
    }

    return segment;
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../../common/access.service";
import { projectManagerRoles } from "../../common/roles";
import { PrismaService } from "../../prisma/prisma.service";
import { sdkKeyWithProjectSelect } from "./sdk-key-read-model";

@Injectable()
export class SdkKeyAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  requireProjectRead(userId: string, projectId: string) {
    return this.access.requireProjectAccess(userId, projectId);
  }

  requireProjectWrite(userId: string, projectId: string) {
    return this.access.requireProjectRole(userId, projectId, projectManagerRoles);
  }

  async findConfigAndEnvironmentForCreate(
    userId: string,
    projectId: string,
    input: { configId?: string; environmentId?: string },
  ) {
    const access = await this.requireProjectWrite(userId, projectId);

    if (!input.configId || !input.environmentId) {
      throw new BadRequestException("configId and environmentId are required");
    }

    const [config, environment] = await Promise.all([
      this.prisma.config.findUnique({ where: { id: input.configId } }),
      this.prisma.environment.findUnique({ where: { id: input.environmentId } }),
    ]);

    if (!config || config.projectId !== projectId) {
      throw new BadRequestException("Config does not belong to the project");
    }

    if (!environment || environment.projectId !== projectId) {
      throw new BadRequestException("Environment does not belong to the project");
    }

    return { access, config, environment };
  }

  async findSdkKeyForWrite(userId: string, sdkKeyId: string) {
    const sdkKey = await this.prisma.sdkKey.findUnique({
      where: { id: sdkKeyId },
      select: sdkKeyWithProjectSelect(),
    });
    if (!sdkKey) {
      throw new NotFoundException("SDK key not found");
    }

    await this.requireProjectWrite(userId, sdkKey.projectId);
    return sdkKey;
  }
}

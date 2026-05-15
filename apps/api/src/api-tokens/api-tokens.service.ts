import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessService } from "../common/access.service";
import { createRawApiToken, hashApiToken } from "../common/api-token-crypto";
import { isApiTokenScope } from "../common/api-token-scopes";
import { createAuditLog, toAuditJson } from "../common/audit-log";
import { organizationManagerRoles } from "../common/roles";
import { PrismaService } from "../prisma/prisma.service";

type CreateApiTokenInput = {
  expiresAt?: string;
  name?: string;
  projectId?: string;
  scopes?: string[];
};

@Injectable()
export class ApiTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(userId: string, organizationId: string) {
    await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);

    return this.prisma.apiToken.findMany({
      where: { organizationId },
      select: this.apiTokenSelect(),
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, organizationId: string, input: CreateApiTokenInput) {
    await this.access.requireOrganizationRole(userId, organizationId, organizationManagerRoles);

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException("API token name is required");
    }

    const scopes = this.normalizeScopes(input.scopes);
    const expiresAt = this.normalizeExpiresAt(input.expiresAt);
    const projectId = input.projectId?.trim() || null;

    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, organizationId },
        select: { id: true },
      });
      if (!project) {
        throw new NotFoundException("Project not found");
      }
    }

    const rawToken = createRawApiToken();
    const tokenPrefix = rawToken.slice(0, 18);
    const tokenHash = hashApiToken(rawToken);

    return this.prisma.$transaction(async (tx) => {
      const apiToken = await tx.apiToken.create({
        data: {
          organizationId,
          projectId,
          userId,
          name,
          tokenPrefix,
          tokenHash,
          scopes,
          expiresAt,
        },
        select: this.apiTokenSelect(),
      });

      await createAuditLog(tx, {
        action: "api_token.created",
        actorUserId: userId,
        entityId: apiToken.id,
        entityType: "api_token",
        metadata: toAuditJson({ projectId, scopes, tokenPrefix }),
        newValue: this.apiTokenAuditValue(apiToken),
        organizationId,
        projectId,
      });

      return {
        ...apiToken,
        token: rawToken,
      };
    });
  }

  async revoke(userId: string, apiTokenId: string) {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { id: apiTokenId },
      select: this.apiTokenSelect(),
    });
    if (!apiToken) {
      throw new NotFoundException("API token not found");
    }

    await this.access.requireOrganizationRole(
      userId,
      apiToken.organizationId,
      organizationManagerRoles,
    );

    if (apiToken.revokedAt) {
      throw new BadRequestException("API token is already revoked");
    }

    return this.prisma.$transaction(async (tx) => {
      const revokeResult = await tx.apiToken.updateMany({
        where: { id: apiTokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (revokeResult.count !== 1) {
        throw new BadRequestException("API token is already revoked");
      }

      const revokedApiToken = await tx.apiToken.findUnique({
        where: { id: apiTokenId },
        select: this.apiTokenSelect(),
      });
      if (!revokedApiToken) {
        throw new NotFoundException("API token not found");
      }

      await createAuditLog(tx, {
        action: "api_token.revoked",
        actorUserId: userId,
        entityId: apiTokenId,
        entityType: "api_token",
        metadata: toAuditJson({
          projectId: apiToken.projectId,
          scopes: apiToken.scopes,
          tokenPrefix: apiToken.tokenPrefix,
        }),
        newValue: this.apiTokenAuditValue(revokedApiToken),
        oldValue: this.apiTokenAuditValue(apiToken),
        organizationId: apiToken.organizationId,
        projectId: apiToken.projectId,
      });

      return revokedApiToken;
    });
  }

  async authenticate(rawToken: string) {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash: hashApiToken(rawToken) },
      select: {
        id: true,
        organizationId: true,
        projectId: true,
        userId: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            avatarUrl: true,
            email: true,
            id: true,
            name: true,
          },
        },
      },
    });

    if (!apiToken || apiToken.revokedAt || this.isExpired(apiToken.expiresAt)) {
      return null;
    }

    await this.markUsed(apiToken.id);

    return apiToken;
  }

  private apiTokenSelect() {
    return {
      id: true,
      organizationId: true,
      projectId: true,
      userId: true,
      name: true,
      tokenPrefix: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          avatarUrl: true,
          email: true,
          id: true,
          name: true,
        },
      },
    } as const;
  }

  private normalizeScopes(scopes: string[] | undefined) {
    const normalizedScopes = [...new Set(scopes ?? [])];
    if (normalizedScopes.length === 0) {
      throw new BadRequestException("At least one API token scope is required");
    }

    for (const scope of normalizedScopes) {
      if (!isApiTokenScope(scope)) {
        throw new BadRequestException("API token scope is invalid");
      }
    }

    return normalizedScopes;
  }

  private normalizeExpiresAt(value: string | undefined) {
    if (!value) {
      return null;
    }

    const expiresAt = new Date(value);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("API token expiration is invalid");
    }

    if (expiresAt <= new Date()) {
      throw new BadRequestException("API token expiration must be in the future");
    }

    return expiresAt;
  }

  private isExpired(expiresAt: Date | null) {
    return Boolean(expiresAt && expiresAt <= new Date());
  }

  private async markUsed(apiTokenId: string) {
    try {
      await this.prisma.apiToken.update({
        where: { id: apiTokenId },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      return;
    }
  }

  private apiTokenAuditValue(apiToken: {
    expiresAt?: Date | null;
    id: string;
    lastUsedAt?: Date | null;
    name: string;
    organizationId: string;
    projectId?: string | null;
    revokedAt?: Date | null;
    scopes: string[];
    tokenPrefix: string;
    userId: string;
  }) {
    return toAuditJson({
      expiresAt: apiToken.expiresAt?.toISOString() ?? null,
      id: apiToken.id,
      lastUsedAt: apiToken.lastUsedAt?.toISOString() ?? null,
      name: apiToken.name,
      organizationId: apiToken.organizationId,
      projectId: apiToken.projectId ?? null,
      revokedAt: apiToken.revokedAt?.toISOString() ?? null,
      scopes: apiToken.scopes,
      tokenPrefix: apiToken.tokenPrefix,
      userId: apiToken.userId,
    });
  }
}

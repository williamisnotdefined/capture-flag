import { Body, Delete, Get, Patch, Post } from "@nestjs/common";
import { RequireApiTokenScopes } from "../api-tokens/api-token-scopes.decorator";
import { RequireApiTokenTenant } from "../api-tokens/api-token-tenant.decorator";
import { SessionOrApiTokenController } from "../auth/session-or-api-token-controller.decorator";
import { CurrentUserId } from "../common/current-user-id.decorator";
import { UuidParam } from "../common/uuid-param.decorator";
import { CreateOrganizationDto, OrganizationMemberDto, UpdateOrganizationMemberDto } from "./dto";
import { OrganizationsService } from "./organizations.service";

@SessionOrApiTokenController("api/v1/organizations")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.organizations.listForUser(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() body: CreateOrganizationDto) {
    return this.organizations.create(userId, body);
  }

  @Get(":organizationId")
  get(@CurrentUserId() userId: string, @UuidParam("organizationId") organizationId: string) {
    return this.organizations.get(userId, organizationId);
  }

  @Get(":organizationId/members")
  @RequireApiTokenScopes("members:read")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  listMembers(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
  ) {
    return this.organizations.listMembers(userId, organizationId);
  }

  @Post(":organizationId/members")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  addMember(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
    @Body() body: OrganizationMemberDto,
  ) {
    return this.organizations.addMember(userId, organizationId, body);
  }

  @Patch(":organizationId/members/:memberId")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  updateMember(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
    @UuidParam("memberId") memberId: string,
    @Body() body: UpdateOrganizationMemberDto,
  ) {
    return this.organizations.updateMember(userId, organizationId, memberId, body);
  }

  @Delete(":organizationId/members/:memberId")
  @RequireApiTokenScopes("members:write")
  @RequireApiTokenTenant({ organizationParam: "organizationId" })
  removeMember(
    @CurrentUserId() userId: string,
    @UuidParam("organizationId") organizationId: string,
    @UuidParam("memberId") memberId: string,
  ) {
    return this.organizations.removeMember(userId, organizationId, memberId);
  }
}

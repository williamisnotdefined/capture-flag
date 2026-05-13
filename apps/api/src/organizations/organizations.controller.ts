import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
@UseGuards(SessionGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.organizations.listForUser(request.user.id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: { name?: string; slug?: string }) {
    return this.organizations.create(request.user.id, body);
  }

  @Get(":organizationId")
  get(@Req() request: AuthenticatedRequest, @Param("organizationId") organizationId: string) {
    return this.organizations.get(request.user.id, organizationId);
  }

  @Get(":organizationId/members")
  listMembers(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId") organizationId: string,
  ) {
    return this.organizations.listMembers(request.user.id, organizationId);
  }

  @Post(":organizationId/members")
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId") organizationId: string,
    @Body() body: { userId?: string; email?: string; role?: string },
  ) {
    return this.organizations.addMember(request.user.id, organizationId, body);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import {
  CreateOrganizationDto,
  OrganizationMemberDto,
  UpdateOrganizationMemberDto,
} from "../common/dtos";
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
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateOrganizationDto) {
    return this.organizations.create(request.user.id, body);
  }

  @Get(":organizationId")
  get(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.get(request.user.id, organizationId);
  }

  @Get(":organizationId/members")
  listMembers(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.listMembers(request.user.id, organizationId);
  }

  @Post(":organizationId/members")
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() body: OrganizationMemberDto,
  ) {
    return this.organizations.addMember(request.user.id, organizationId, body);
  }

  @Patch(":organizationId/members/:memberId")
  updateMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
    @Body() body: UpdateOrganizationMemberDto,
  ) {
    return this.organizations.updateMember(request.user.id, organizationId, memberId, body);
  }

  @Delete(":organizationId/members/:memberId")
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
  ) {
    return this.organizations.removeMember(request.user.id, organizationId, memberId);
  }
}

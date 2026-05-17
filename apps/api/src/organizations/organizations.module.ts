import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import {
  OrganizationMemberAccessService,
  OrganizationMemberAuditService,
  OrganizationMemberTargetService,
} from "./support";
import {
  AddOrganizationMemberService,
  BulkDeleteOrganizationsService,
  BulkRemoveOrganizationMembersService,
  CreateOrganizationService,
  DeleteOrganizationService,
  GetOrganizationService,
  ListOrganizationMembersService,
  ListUserOrganizationsService,
  RemoveOrganizationMemberService,
  UpdateOrganizationMemberService,
  UpdateOrganizationService,
} from "./use-cases";

@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationMemberAccessService,
    OrganizationMemberAuditService,
    OrganizationMemberTargetService,
    ListUserOrganizationsService,
    CreateOrganizationService,
    GetOrganizationService,
    ListOrganizationMembersService,
    AddOrganizationMemberService,
    UpdateOrganizationMemberService,
    RemoveOrganizationMemberService,
    UpdateOrganizationService,
    DeleteOrganizationService,
    BulkDeleteOrganizationsService,
    BulkRemoveOrganizationMembersService,
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

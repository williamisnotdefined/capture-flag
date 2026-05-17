import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectAuditService, ProjectMemberTargetService } from "./support";
import {
  AddProjectMemberService,
  BulkDeleteProjectsService,
  BulkRemoveProjectMembersService,
  CreateProjectService,
  DeleteProjectService,
  GetProjectService,
  ListOrganizationProjectsService,
  ListProjectMembersService,
  RemoveProjectMemberService,
  UpdateProjectMemberService,
  UpdateProjectService,
} from "./use-cases";

@Module({
  imports: [CommonModule, ApiTokensModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectAuditService,
    ProjectMemberTargetService,
    ListOrganizationProjectsService,
    CreateProjectService,
    GetProjectService,
    UpdateProjectService,
    DeleteProjectService,
    ListProjectMembersService,
    AddProjectMemberService,
    UpdateProjectMemberService,
    RemoveProjectMemberService,
    BulkDeleteProjectsService,
    BulkRemoveProjectMembersService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}

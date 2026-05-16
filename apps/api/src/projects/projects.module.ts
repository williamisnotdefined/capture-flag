import { Module } from "@nestjs/common";
import { ApiTokensModule } from "../api-tokens/api-tokens.module";
import { CommonModule } from "../common/common.module";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectAuditService, ProjectMemberSupportService } from "./support";
import {
  AddProjectMemberService,
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
    ProjectMemberSupportService,
    ListOrganizationProjectsService,
    CreateProjectService,
    GetProjectService,
    UpdateProjectService,
    DeleteProjectService,
    ListProjectMembersService,
    AddProjectMemberService,
    UpdateProjectMemberService,
    RemoveProjectMemberService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}

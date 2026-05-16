import { Injectable } from "@nestjs/common";
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

@Injectable()
export class ProjectsService {
  constructor(
    private readonly listOrganizationProjects: ListOrganizationProjectsService,
    private readonly createProject: CreateProjectService,
    private readonly getProject: GetProjectService,
    private readonly updateProject: UpdateProjectService,
    private readonly deleteProject: DeleteProjectService,
    private readonly listProjectMembers: ListProjectMembersService,
    private readonly addProjectMember: AddProjectMemberService,
    private readonly updateProjectMember: UpdateProjectMemberService,
    private readonly removeProjectMemberService: RemoveProjectMemberService,
  ) {}

  listForOrganization(userId: string, organizationId: string) {
    return this.listOrganizationProjects.execute({ userId, organizationId });
  }

  create(userId: string, organizationId: string, input: { name?: string; slug?: string }) {
    return this.createProject.execute({ userId, organizationId, input });
  }

  get(userId: string, projectId: string) {
    return this.getProject.execute({ userId, projectId });
  }

  update(userId: string, projectId: string, input: { name?: string; slug?: string }) {
    return this.updateProject.execute({ userId, projectId, input });
  }

  delete(userId: string, projectId: string) {
    return this.deleteProject.execute({ userId, projectId });
  }

  listMembers(userId: string, projectId: string) {
    return this.listProjectMembers.execute({ userId, projectId });
  }

  addMember(
    actorUserId: string,
    projectId: string,
    input: { userId?: string; email?: string; role?: string },
  ) {
    return this.addProjectMember.execute({ actorUserId, projectId, input });
  }

  updateMember(actorUserId: string, projectId: string, memberId: string, input: { role?: string }) {
    return this.updateProjectMember.execute({ actorUserId, projectId, memberId, input });
  }

  removeMember(actorUserId: string, projectId: string, memberId: string) {
    return this.removeProjectMemberService.execute({ actorUserId, projectId, memberId });
  }
}

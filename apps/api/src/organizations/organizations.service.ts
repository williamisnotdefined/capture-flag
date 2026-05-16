import { Injectable } from "@nestjs/common";
import {
  AddOrganizationMemberService,
  CreateOrganizationService,
  DeleteOrganizationService,
  GetOrganizationService,
  ListOrganizationMembersService,
  ListUserOrganizationsService,
  RemoveOrganizationMemberService,
  UpdateOrganizationMemberService,
  UpdateOrganizationService,
} from "./use-cases";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly listUserOrganizations: ListUserOrganizationsService,
    private readonly createOrganization: CreateOrganizationService,
    private readonly getOrganization: GetOrganizationService,
    private readonly listOrganizationMembers: ListOrganizationMembersService,
    private readonly addOrganizationMember: AddOrganizationMemberService,
    private readonly updateOrganizationMember: UpdateOrganizationMemberService,
    private readonly removeOrganizationMember: RemoveOrganizationMemberService,
    private readonly updateOrganization: UpdateOrganizationService,
    private readonly deleteOrganization: DeleteOrganizationService,
  ) {}

  listForUser(userId: string) {
    return this.listUserOrganizations.execute({ userId });
  }

  create(userId: string, input: { name?: string; slug?: string }) {
    return this.createOrganization.execute({ userId, input });
  }

  get(userId: string, organizationId: string) {
    return this.getOrganization.execute({ userId, organizationId });
  }

  update(userId: string, organizationId: string, input: { name?: string; slug?: string }) {
    return this.updateOrganization.execute({ userId, organizationId, input });
  }

  delete(userId: string, organizationId: string) {
    return this.deleteOrganization.execute({ userId, organizationId });
  }

  listMembers(userId: string, organizationId: string) {
    return this.listOrganizationMembers.execute({ userId, organizationId });
  }

  addMember(
    actorUserId: string,
    organizationId: string,
    input: { userId?: string; email?: string; role?: string },
  ) {
    return this.addOrganizationMember.execute({ actorUserId, organizationId, input });
  }

  updateMember(
    actorUserId: string,
    organizationId: string,
    memberId: string,
    input: { role?: string },
  ) {
    return this.updateOrganizationMember.execute({ actorUserId, organizationId, memberId, input });
  }

  removeMember(actorUserId: string, organizationId: string, memberId: string) {
    return this.removeOrganizationMember.execute({ actorUserId, organizationId, memberId });
  }
}

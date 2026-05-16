import { Injectable } from "@nestjs/common";
import { toAuditJson } from "../../common/audit-log";

@Injectable()
export class OrganizationMemberAuditService {
  organizationMemberAuditValue(member: {
    id: string;
    organizationId: string;
    role: string;
    userId: string;
  }) {
    return toAuditJson({
      id: member.id,
      organizationId: member.organizationId,
      role: member.role,
      userId: member.userId,
    });
  }
}

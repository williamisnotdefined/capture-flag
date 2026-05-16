import { Injectable } from "@nestjs/common";
import { toAuditJson } from "../../common/audit-log";

@Injectable()
export class ProjectAuditService {
  projectMemberAuditValue(member: {
    id: string;
    projectId: string;
    role: string;
    userId: string;
  }) {
    return toAuditJson({
      id: member.id,
      projectId: member.projectId,
      role: member.role,
      userId: member.userId,
    });
  }

  configAuditValue(config: {
    description?: string | null;
    id: string;
    key: string;
    name: string;
    projectId: string;
  }) {
    return toAuditJson({
      description: config.description ?? null,
      id: config.id,
      key: config.key,
      name: config.name,
      projectId: config.projectId,
    });
  }
}

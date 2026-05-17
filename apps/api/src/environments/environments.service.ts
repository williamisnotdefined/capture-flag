import { Injectable } from "@nestjs/common";
import {
  BulkDeleteEnvironmentsService,
  CreateEnvironmentService,
  DeleteEnvironmentService,
  ListEnvironmentsService,
  UpdateEnvironmentService,
} from "./use-cases";

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly listEnvironments: ListEnvironmentsService,
    private readonly createEnvironment: CreateEnvironmentService,
    private readonly updateEnvironment: UpdateEnvironmentService,
    private readonly deleteEnvironment: DeleteEnvironmentService,
    private readonly bulkDeleteEnvironments: BulkDeleteEnvironmentsService,
  ) {}

  list(userId: string, projectId: string) {
    return this.listEnvironments.execute({ userId, projectId });
  }

  create(userId: string, projectId: string, input: { name?: string; key?: string }) {
    return this.createEnvironment.execute({ userId, projectId, input });
  }

  update(
    userId: string,
    environmentId: string,
    input: { name?: string; key?: string; sortOrder?: number },
  ) {
    return this.updateEnvironment.execute({ userId, environmentId, input });
  }

  delete(userId: string, environmentId: string) {
    return this.deleteEnvironment.execute({ userId, environmentId });
  }

  bulkDelete(userId: string, projectId: string, environmentIds: string[]) {
    return this.bulkDeleteEnvironments.execute({ userId, projectId, environmentIds });
  }
}

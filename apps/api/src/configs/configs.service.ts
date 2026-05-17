import { Injectable } from "@nestjs/common";
import {
  BulkDeleteConfigsService,
  CreateConfigService,
  DeleteConfigService,
  ListConfigsService,
  UpdateConfigService,
} from "./use-cases";

@Injectable()
export class ConfigsService {
  constructor(
    private readonly listConfigs: ListConfigsService,
    private readonly createConfig: CreateConfigService,
    private readonly updateConfig: UpdateConfigService,
    private readonly deleteConfig: DeleteConfigService,
    private readonly bulkDeleteConfigs: BulkDeleteConfigsService,
  ) {}

  list(userId: string, projectId: string) {
    return this.listConfigs.execute({ userId, projectId });
  }

  create(
    userId: string,
    projectId: string,
    input: { key?: string; name?: string; description?: string },
  ) {
    return this.createConfig.execute({ userId, projectId, input });
  }

  update(userId: string, configId: string, input: { description?: string; name?: string }) {
    return this.updateConfig.execute({ userId, configId, input });
  }

  delete(userId: string, configId: string) {
    return this.deleteConfig.execute({ userId, configId });
  }

  bulkDelete(userId: string, projectId: string, configIds: string[]) {
    return this.bulkDeleteConfigs.execute({ userId, projectId, configIds });
  }
}

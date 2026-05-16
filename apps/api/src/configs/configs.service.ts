import { Injectable } from "@nestjs/common";
import { CreateConfigService, DeleteConfigService, ListConfigsService } from "./use-cases";

@Injectable()
export class ConfigsService {
  constructor(
    private readonly listConfigs: ListConfigsService,
    private readonly createConfig: CreateConfigService,
    private readonly deleteConfig: DeleteConfigService,
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

  delete(userId: string, configId: string) {
    return this.deleteConfig.execute({ userId, configId });
  }
}

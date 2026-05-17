import { Injectable } from "@nestjs/common";
import {
  BulkRevokeSdkKeysService,
  CreateSdkKeyService,
  ListSdkKeysService,
  RevokeSdkKeyService,
  RotateSdkKeyService,
} from "./use-cases";

@Injectable()
export class SdkKeysService {
  constructor(
    private readonly listSdkKeys: ListSdkKeysService,
    private readonly createSdkKey: CreateSdkKeyService,
    private readonly revokeSdkKey: RevokeSdkKeyService,
    private readonly rotateSdkKey: RotateSdkKeyService,
    private readonly bulkRevokeSdkKeys: BulkRevokeSdkKeysService,
  ) {}

  list(userId: string, projectId: string) {
    return this.listSdkKeys.execute({ userId, projectId });
  }

  create(
    userId: string,
    projectId: string,
    input: { configId?: string; environmentId?: string; name?: string },
  ) {
    return this.createSdkKey.execute({ userId, projectId, input });
  }

  revoke(userId: string, sdkKeyId: string) {
    return this.revokeSdkKey.execute({ userId, sdkKeyId });
  }

  bulkRevoke(userId: string, projectId: string, sdkKeyIds: string[]) {
    return this.bulkRevokeSdkKeys.execute({ userId, projectId, sdkKeyIds });
  }

  rotate(userId: string, sdkKeyId: string) {
    return this.rotateSdkKey.execute({ userId, sdkKeyId });
  }
}

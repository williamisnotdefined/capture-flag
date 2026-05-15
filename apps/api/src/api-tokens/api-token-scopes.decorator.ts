import { SetMetadata } from "@nestjs/common";
import type { ApiTokenScope } from "../common/api-token-scopes";

export const apiTokenScopesMetadataKey = "capture-flag:api-token-scopes";

export function RequireApiTokenScopes(...scopes: ApiTokenScope[]) {
  return SetMetadata(apiTokenScopesMetadataKey, scopes);
}

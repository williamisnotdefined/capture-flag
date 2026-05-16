import { Injectable } from "@nestjs/common";

@Injectable()
export class PublicConfigCacheService {
  cacheControlHeader() {
    return process.env.PUBLIC_CONFIG_CACHE_CONTROL ?? "private, no-cache";
  }

  matchesIfNoneMatch(ifNoneMatch: string | undefined, etag: string) {
    if (!ifNoneMatch) {
      return false;
    }

    const normalizedEtag = this.normalizeEntityTag(etag);

    return ifNoneMatch
      .split(",")
      .map((value) => value.trim())
      .some((value) => value === "*" || this.normalizeEntityTag(value) === normalizedEtag);
  }

  private normalizeEntityTag(value: string) {
    const trimmedValue = value.trim();
    return trimmedValue.toLowerCase().startsWith("w/") ? trimmedValue.slice(2) : trimmedValue;
  }
}

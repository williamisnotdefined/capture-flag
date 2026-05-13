import { createHash, randomBytes } from "node:crypto";

export function createRawSdkKey(): string {
  return `cf_sdk_${randomBytes(10).toString("hex")}_${randomBytes(24).toString("base64url")}`;
}

export function hashSdkKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

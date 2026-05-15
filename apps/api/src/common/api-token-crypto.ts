import { createHash, randomBytes } from "node:crypto";

export function createRawApiToken(): string {
  return `cf_api_${randomBytes(10).toString("hex")}_${randomBytes(32).toString("base64url")}`;
}

export function hashApiToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

import { prisma } from "./db";
import { assertE2eDatabaseUrl } from "./env";

const tables = [
  "audit_logs",
  "api_tokens",
  "sdk_keys",
  "feature_flag_environment_values",
  "segments",
  "feature_flags",
  "config_environment_states",
  "configs",
  "environments",
  "project_members",
  "projects",
  "organization_members",
  "organizations",
  "sessions",
  "oauth_accounts",
  "users",
];

export async function resetDatabase() {
  assertE2eDatabaseUrl();

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}

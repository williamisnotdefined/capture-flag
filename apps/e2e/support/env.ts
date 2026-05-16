export const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ??
  (process.env.DATABASE_URL?.includes("e2e")
    ? process.env.DATABASE_URL
    : "postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public");

export const apiPort = Number(process.env.E2E_API_PORT ?? 3100);
export const clientPort = Number(process.env.E2E_CLIENT_PORT ?? 5174);
export const apiBaseUrl = process.env.E2E_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
export const clientBaseUrl = process.env.E2E_CLIENT_BASE_URL ?? `http://127.0.0.1:${clientPort}`;
export const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "cf_session";

export function assertE2eDatabaseUrl() {
  if (!e2eDatabaseUrl.includes("e2e")) {
    throw new Error("Refusing to use database because E2E database URL does not contain e2e");
  }
}

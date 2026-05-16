import { defineConfig, devices } from "@playwright/test";
import { apiBaseUrl, apiPort, clientBaseUrl, clientPort, e2eDatabaseUrl } from "./support/env";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: clientBaseUrl,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node -r ts-node/register/transpile-only src/main.ts",
      cwd: "../api",
      env: {
        API_BASE_URL: apiBaseUrl,
        API_TRUST_PROXY: "false",
        CLIENT_BASE_URL: clientBaseUrl,
        CORS_ORIGINS: clientBaseUrl,
        DATABASE_URL: e2eDatabaseUrl,
        MANAGEMENT_API_THROTTLE_LIMIT: "10000",
        MANAGEMENT_API_THROTTLE_TTL_MS: "60000",
        PORT: String(apiPort),
        PUBLIC_SDK_IP_THROTTLE_LIMIT: "10000",
        PUBLIC_SDK_THROTTLE_LIMIT: "10000",
        PUBLIC_SDK_THROTTLE_TTL_MS: "60000",
        REQUIRE_HTTPS: "false",
        SESSION_COOKIE_NAME: "cf_session",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: `${apiBaseUrl}/health`,
    },
    {
      command: `npm --workspace @capture-flag/client run dev -- --host 127.0.0.1 --port ${clientPort}`,
      cwd: "../..",
      env: {
        VITE_API_BASE_URL: apiBaseUrl,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: clientBaseUrl,
    },
  ],
  workers: 1,
});

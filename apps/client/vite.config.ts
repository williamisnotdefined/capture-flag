import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@api": fileURLToPath(new URL("./src/api", import.meta.url)),
      "@capture-flag/shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url),
      ),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@layouts": fileURLToPath(new URL("./src/layouts", import.meta.url)),
      "@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "@routing": fileURLToPath(new URL("./src/routing", import.meta.url)),
      "@src": fileURLToPath(new URL("./src", import.meta.url)),
      "@stories": fileURLToPath(new URL("./src/stories", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    coverage: {
      all: true,
      exclude: [
        "src/**/*.stories.{ts,tsx}",
        "src/**/__tests__/**",
        "src/api/**/index.ts",
        "src/components/**/types.ts",
        "src/App.tsx",
        "src/main.tsx",
        "src/pages/**/index.ts",
        "src/router.tsx",
        "src/stories/**",
        "src/test/**",
        "src/types.ts",
      ],
      include: [
        "src/api/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "src/core/**/*.{ts,tsx}",
        "src/pages/**/*.{ts,tsx}",
        "src/permissions.ts",
      ],
      provider: "v8",
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@capture-flag/evaluator": fileURLToPath(
        new URL("../evaluator/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
  },
});

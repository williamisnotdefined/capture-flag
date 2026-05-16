import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          "@api": fileURLToPath(new URL("../src/api", import.meta.url)),
          "@capture-flag/shared": fileURLToPath(
            new URL("../../../packages/shared/src/index.ts", import.meta.url),
          ),
          "@components": fileURLToPath(new URL("../src/components", import.meta.url)),
          "@core": fileURLToPath(new URL("../src/core", import.meta.url)),
          "@layouts": fileURLToPath(new URL("../src/layouts", import.meta.url)),
          "@pages": fileURLToPath(new URL("../src/pages", import.meta.url)),
          "@routing": fileURLToPath(new URL("../src/routing", import.meta.url)),
          "@src": fileURLToPath(new URL("../src", import.meta.url)),
          "@stories": fileURLToPath(new URL("../src/stories", import.meta.url)),
        },
      },
    }),
};

export default config;

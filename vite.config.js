import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import packageConfig from "open-website-builder/vite.config.js";

const siteRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(siteRoot, "../open-website-builder");

export default defineConfig(async (env) => {
  const baseConfig = await packageConfig(env);

  return {
    ...baseConfig,
    root: packageRoot,
    server: {
      ...(baseConfig.server || {}),
      port: 3004,
      strictPort: true,
      fs: {
        allow: [packageRoot, siteRoot],
      },
    },
  };
});

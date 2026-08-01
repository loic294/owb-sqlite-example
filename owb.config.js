import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createOwbBackendPlugin,
  createOwbImagePlugin,
  createSqliteBackendProviders,
} from "open-website-builder";

const siteRoot = dirname(fileURLToPath(import.meta.url));

export const owbConfig = {
  contentRoot: siteRoot,
  sqliteDbPath: resolve(siteRoot, "data/site.sqlite"),
  imagesRoot: resolve(siteRoot, "images"),
  publicRoot: resolve(siteRoot, "public"),
  publishedOutputDir: resolve(siteRoot, "dist-publish"),
  imageBaseUrl: "http://localhost:3004/images/",
};

export function plugins({ appRoot, r2, siteConfig }) {
  const backendProviders = createSqliteBackendProviders({
    appRoot,
    siteConfig,
    r2,
  });

  return [
    createOwbBackendPlugin({ appRoot, siteConfig, backendProviders }),
    createOwbImagePlugin({ imageBaseUrl: siteConfig.imageBaseUrl }),
  ];
}

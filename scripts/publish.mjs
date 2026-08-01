import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createSqlitePublishProvider,
  loadSiteConfig,
  openSqliteDatabase,
  publishSite,
} from "open-website-builder";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteConfig = await loadSiteConfig(resolve(siteRoot, "owb.config.js"));
const database = openSqliteDatabase(siteConfig.sqliteDbPath);

try {
  const publishProvider = createSqlitePublishProvider({
    database,
    contentRoot: siteConfig.contentRoot,
    imagesRoot: siteConfig.imagesRoot,
    publicRoot: siteConfig.publicRoot,
  });
  const result = await publishSite({
    publishProvider,
    outputDir: siteConfig.publishedOutputDir,
    appRoot: resolve(siteRoot, "../open-website-builder"),
  });
  process.stdout.write(`Published ${result.pages.length} output(s)\n`);
} finally {
  database.close();
}

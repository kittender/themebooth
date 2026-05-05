import * as path from "path";
import { exec } from "child_process";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, manifestExists, readManifest } from "../utils/paths";
import { validateManifest } from "../core/manifest";
import { PreviewServer } from "../preview/server";

export async function previewCommand(): Promise<void> {
  try {
    const themeDir = process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    // Check manifest exists
    const exists = await manifestExists(paths.manifest);
    if (!exists) {
      logger.error("No manifest.json found in current directory");
      throw new Error("Manifest not found. Run 'themebooth init' first.");
    }

    // Validate manifest
    const manifestData = await readManifest(paths.manifest);
    const validation = validateManifest(manifestData);
    if (!validation.success) {
      logger.error("Manifest validation failed:");
      validation.errors.forEach((err) => {
        logger.error(`  • ${err.field}: ${err.message}`);
      });
      throw new Error("Invalid manifest");
    }

    const manifest = validation.data;

    // Start server
    const server = new PreviewServer({
      manifestPath: paths.manifest,
      previewPath: paths.preview,
      themeName: manifest.name,
    });

    await server.start();

    const port = server.getPort();
    const previewUrl = `http://localhost:${port}`;

    logger.info("");
    logger.info("✨ Live preview ready!");
    logger.info(`📝 Edit manifest.json to see changes`);
    logger.info(`💾 Changes reload automatically`);
    logger.info(`🌐 Opening browser...`);
    logger.info("");
    logger.info(`Press Ctrl+C to stop the server`);

    // Try to open browser
    openBrowser(previewUrl).catch(() => {
      logger.info(`Open in browser: ${previewUrl}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("\nShutting down preview server...");
      await server.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start preview: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd: string;

    if (process.platform === "darwin") {
      cmd = `open "${url}"`;
    } else if (process.platform === "win32") {
      cmd = `start "${url}"`;
    } else {
      cmd = `xdg-open "${url}"`;
    }

    exec(cmd, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

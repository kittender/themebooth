import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, manifestExists, readManifest } from "../utils/paths";
import { validateManifest } from "../core/manifest";
import { validateManifestComprehensive } from "../utils/validation";
import { handleVSCodePublish } from "../publish/vscode";
import { handleZedPublish } from "../publish/zed";
import { handleNotepadPublish } from "../publish/notepad-plus";

export async function publishCommand(platform?: string): Promise<void> {
  try {
    const themeDir = process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    // Check manifest exists
    const exists = await manifestExists(paths.manifest);
    if (!exists) {
      logger.error("No manifest.json found in current directory");
      throw new Error("Manifest not found. Run 'themebooth init' first.");
    }

    // Validate manifest comprehensively
    logger.info("Validating manifest.json...");
    const validation = await validateManifestComprehensive(paths.manifest);
    if (!validation.isValid) {
      logger.error("Manifest validation failed:");
      for (const err of validation.errors) {
        const locationStr = err.line ? ` (line ${err.line}${err.column ? `, col ${err.column}` : ""})` : "";
        logger.error(`  • ${err.field}${locationStr}: ${err.message}`);
        if (err.suggestion) {
          logger.info(`    → ${err.suggestion}`);
        }
      }
      throw new Error("Invalid manifest");
    }

    if (!validation.manifest) {
      throw new Error("Failed to load validated manifest");
    }

    const manifest = validation.manifest;

    // Check if package exists
    const packageDir = path.join(paths.output, manifest.name);
    try {
      const files = await fs.readdir(packageDir);
      if (files.length === 0) {
        logger.error(`Theme package directory is empty at ${packageDir}`);
        logger.info("Run 'themebooth package' to generate theme files");
        throw new Error("Package not found");
      }
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        logger.error(`Theme package not found at ${packageDir}`);
        logger.info("Run 'themebooth package' to generate theme files");
        throw new Error("Package not found");
      }
      throw error;
    }

    // Route to platform publisher
    const platformLower = (platform || "").toLowerCase();

    if (platformLower === "vscode" || platformLower === "vs-code") {
      await handleVSCodePublish(packageDir, manifest.name);
    } else if (platformLower === "notepad++" || platformLower === "notepad-plus" || platformLower === "notepadplusplus") {
      await handleNotepadPublish(packageDir, manifest.name, manifest);
    } else if (platformLower === "zed") {
      await handleZedPublish(packageDir, manifest.name, manifest);
    } else {
      if (!platform) {
        logger.error("Platform required");
      } else {
        logger.error(`Unknown platform: ${platform}`);
      }
      logger.info("");
      logger.info("Available platforms:");
      logger.info("  • vscode      - VS Code Marketplace");
      logger.info("  • notepad++   - Notepad++ Package Control");
      logger.info("  • zed         - Zed Registry");
      logger.info("");
      logger.info("Usage: themebooth publish <platform>");
      throw new Error("Invalid platform");
    }

    logger.info("");
    logger.success("Next steps: Follow the instructions above to publish your theme");
  } catch (error) {
    logger.error(`Failed to publish theme: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, manifestExists, readManifest } from "../utils/paths";
import { validateManifest } from "../core/manifest";

async function publishVSCode(manifestPath: string, outputDir: string): Promise<void> {
  const manifest = await readManifest(manifestPath);
  const validation = validateManifest(manifest);
  if (!validation.success) {
    throw new Error("Invalid manifest");
  }

  logger.title("VS Code Marketplace Publishing");
  logger.info("To publish to VS Code Marketplace:");
  logger.info("");
  logger.info("1. Install vsce (VS Code Extension Manager):");
  logger.info("   npm install -g vsce");
  logger.info("");
  logger.info("2. Create a publisher account at:");
  logger.info("   https://marketplace.visualstudio.com/");
  logger.info("");
  logger.info("3. Get a Personal Access Token:");
  logger.info("   • Go to https://dev.azure.com/_usersSettings/tokens");
  logger.info("   • Create token with 'Marketplace' scope");
  logger.info("   • Keep it safe");
  logger.info("");
  logger.info("4. Update vsce publisher in your package.json:");
  logger.info('   "publisher": "your-publisher-name"');
  logger.info("");
  logger.info("5. Publish your theme:");
  logger.info("   vsce publish --token YOUR_TOKEN");
  logger.info("");
  logger.info("Theme file location:");
  const themeFile = path.join(outputDir, `${validation.data.name}.json`);
  const relPath = path.relative(process.cwd(), themeFile);
  logger.info(`  ${relPath}`);
}

async function publishNotepadPlus(manifestPath: string, outputDir: string): Promise<void> {
  const manifest = await readManifest(manifestPath);
  const validation = validateManifest(manifest);
  if (!validation.success) {
    throw new Error("Invalid manifest");
  }

  logger.title("Notepad++ Theme Publishing");
  logger.info("To publish to Notepad++ Package Control:");
  logger.info("");
  logger.info("1. Go to the Notepad++ plugin registry:");
  logger.info("   https://github.com/notepad-plus-plus/nppPluginList");
  logger.info("");
  logger.info("2. Fork the repository to your GitHub account");
  logger.info("");
  logger.info("3. Create a new branch for your theme:");
  logger.info("   git checkout -b add-theme-name");
  logger.info("");
  logger.info("4. Add your XML file to the xml/ folder:");
  const xmlFile = path.join(outputDir, `${validation.data.name}.xml`);
  const relPath = path.relative(process.cwd(), xmlFile);
  logger.info(`   cp ${relPath} xml/`);
  logger.info("");
  logger.info("5. Update plugins/plugin.md with your theme entry");
  logger.info("");
  logger.info("6. Create a Pull Request");
  logger.info("");
  logger.info("Theme file location:");
  logger.info(`  ${relPath}`);
}

async function publishZed(manifestPath: string, outputDir: string): Promise<void> {
  const manifest = await readManifest(manifestPath);
  const validation = validateManifest(manifest);
  if (!validation.success) {
    throw new Error("Invalid manifest");
  }

  logger.title("Zed Registry Publishing");
  logger.info("To publish to Zed registry:");
  logger.info("");
  logger.info("1. Create a Zed account at:");
  logger.info("   https://zed.dev");
  logger.info("");
  logger.info("2. Get your API token from user settings");
  logger.info("");
  logger.info("3. Login to Zed CLI:");
  logger.info("   zed auth login");
  logger.info("");
  logger.info("4. Publish your theme:");
  const themeFile = path.join(outputDir, `zed-${validation.data.name}.json`);
  const relPath = path.relative(process.cwd(), themeFile);
  logger.info(`   zed theme publish ${relPath}`);
  logger.info("");
  logger.info("Or manually upload at:");
  logger.info("   https://zed.dev/extensions/themes");
  logger.info("");
  logger.info("Theme file location:");
  logger.info(`  ${relPath}`);
}

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

    // Check if package exists
    const packageDir = path.join(paths.output, manifest.name);
    try {
      await fs.access(packageDir);
    } catch {
      logger.error(`Theme package not found at ${packageDir}`);
      logger.info("Run 'themebooth package' first to generate theme files");
      throw new Error("Package not found");
    }

    // Route to platform publisher
    const platformLower = (platform || "").toLowerCase();

    if (platformLower === "vscode" || platformLower === "vs-code") {
      await publishVSCode(paths.manifest, packageDir);
    } else if (platformLower === "notepad++" || platformLower === "notepad-plus" || platformLower === "notepadplusplus") {
      await publishNotepadPlus(paths.manifest, packageDir);
    } else if (platformLower === "zed") {
      await publishZed(paths.manifest, packageDir);
    } else {
      logger.error(`Unknown platform: ${platform}`);
      logger.info("");
      logger.title("Available Platforms");
      logger.info("  vscode          - VS Code Marketplace");
      logger.info("  notepad++       - Notepad++ Package Control");
      logger.info("  zed             - Zed Registry");
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

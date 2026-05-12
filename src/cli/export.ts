import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, manifestExists, readManifest } from "../utils/paths";
import { transpileTheme } from "../core/transpiler";
import { validateManifestComprehensive } from "../utils/validation";

export async function exportCommand(platform: string, options: any): Promise<void> {
  try {
    const themeDir = process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    // Check manifest exists
    const exists = await manifestExists(paths.manifest);
    if (!exists) {
      logger.error("No manifest.json found in current directory");
      logger.info("Run 'themebooth init' to create a theme project");
      throw new Error("Manifest not found");
    }

    // Validate manifest
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

    // Determine output directory
    const outputDir = options.output || path.join(themeDir, ".themebooth", "output", `${manifest.name}-${platform}`);
    await fs.mkdir(outputDir, { recursive: true });

    logger.info(`Exporting ${platform} theme: ${manifest.name}@${manifest.version}`);

    // Transpile to all platforms (we'll filter later)
    const transpilationResult = await transpileTheme(paths.manifest, outputDir);

    // Filter results for requested platform
    const platformResults = transpilationResult.results.filter((result) => {
      if (platform.toLowerCase() === "sublime") {
        return result.platform === "Sublime Text";
      }
      return result.platform.toLowerCase().includes(platform.toLowerCase());
    });

    if (platformResults.length === 0) {
      logger.error(`No export results for platform: ${platform}`);
      throw new Error(`Platform ${platform} not found in transpilation results`);
    }

    // Report results
    logger.success(`Theme exported to ${outputDir}`);
    logger.info("\nExport results:");

    for (const result of platformResults) {
      if (result.success) {
        const relativePath = path.relative(themeDir, result.path || "");
        logger.success(`  ✓ ${result.platform}`);
        logger.info(`    → ${relativePath}`);
      } else {
        logger.error(`  ✗ ${result.platform}: ${result.error}`);
      }
    }

    // Show platform-specific info
    if (platform.toLowerCase() === "sublime") {
      logger.info("\nSublime Text files generated:");
      logger.info(`  • ${manifest.name}.sublime-color-scheme.json - Color and syntax highlighting`);
      logger.info(`  • ${manifest.name}.sublime-theme.json - UI theme (buttons, panels, etc.)`);
      logger.info(`  • metadata.json - Theme metadata`);
      logger.info("\nNext steps:");
      logger.info("  1. Package for Sublime: themebooth export sublime --package");
      logger.info("  2. Submit to Package Control: https://packagecontrol.io/docs/submit");
    }
  } catch (error) {
    logger.error(`Failed to export theme: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function exportSublimePackageCommand(options: any): Promise<void> {
  try {
    const themeDir = process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    const exists = await manifestExists(paths.manifest);
    if (!exists) {
      logger.error("No manifest.json found");
      throw new Error("Manifest not found");
    }

    const validation = await validateManifestComprehensive(paths.manifest);
    if (!validation.isValid || !validation.manifest) {
      throw new Error("Invalid manifest");
    }

    const manifest = validation.manifest;
    const themeName = manifest.name;
    const packageName = options.name || `sublime-${themeName}`;
    const outputDir = options.output || path.join(themeDir, ".themebooth", `${packageName}`);

    logger.info(`Creating Sublime package: ${packageName}`);

    // Create package directory structure
    await fs.mkdir(path.join(outputDir, "themes"), { recursive: true });
    await fs.mkdir(path.join(outputDir, "color-schemes"), { recursive: true });

    // Transpile theme
    const transpilationResult = await transpileTheme(paths.manifest, path.join(outputDir, "color-schemes"));

    // Move files to appropriate locations
    const colorSchemeFile = `${themeName}.sublime-color-scheme.json`;
    const uiThemeFile = `${themeName}.sublime-theme.json`;

    // Create .no-sublime-package to mark as development package (optional)
    if (options.dev) {
      await fs.writeFile(path.join(outputDir, ".no-sublime-package"), "", "utf-8");
      logger.info("Created .no-sublime-package (development mode)");
    }

    // Create Package Control metadata
    const packageControlMetadata = {
      schema_version: "3.0.0",
      packages: [
        {
          name: packageName,
          description: manifest.description || `${themeName} theme for Sublime Text`,
          author: manifest.author,
          homepage: options.homepage || "",
          previous_names: [],
          labels: ["color-scheme", "theme"],
          releases: [
            {
              version: manifest.version,
              date: new Date().toISOString().split("T")[0],
              url: options.url || "",
              sublime_text: ">=4000",
            },
          ],
        },
      ],
    };

    await fs.writeFile(
      path.join(outputDir, "packages.json"),
      JSON.stringify(packageControlMetadata, null, 2),
      "utf-8"
    );

    logger.success(`Sublime package created: ${outputDir}`);
    logger.info("\nPackage structure:");
    logger.info(`  color-schemes/`);
    logger.info(`    └── ${colorSchemeFile}`);
    logger.info(`  themes/`);
    logger.info(`    └── ${uiThemeFile}`);
    logger.info(`  packages.json`);
    logger.info("\nNext: Submit to Package Control at https://packagecontrol.io/docs/submit");
  } catch (error) {
    logger.error(`Failed to create package: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Task 4.1: JetBrains export command
export async function exportIntellijCommand(options: any): Promise<void> {
  try {
    const themeDir = process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    const exists = await manifestExists(paths.manifest);
    if (!exists) {
      logger.error("No manifest.json found");
      throw new Error("Manifest not found");
    }

    const validation = await validateManifestComprehensive(paths.manifest);
    if (!validation.isValid || !validation.manifest) {
      throw new Error("Invalid manifest");
    }

    const manifest = validation.manifest;
    const outputDir = options.output || path.join(themeDir, ".themebooth", "output", `${manifest.name}-intellij`);
    await fs.mkdir(outputDir, { recursive: true });

    logger.info(`Exporting JetBrains theme: ${manifest.name}@${manifest.version}`);

    const transpilationResult = await transpileTheme(paths.manifest, outputDir);

    const jetbrainsResults = transpilationResult.results.filter((result) => result.platform === "JetBrains");

    if (jetbrainsResults.length === 0) {
      logger.error("No JetBrains export results");
      throw new Error("JetBrains export failed");
    }

    logger.success(`Theme exported to ${outputDir}`);
    logger.info("\nGenerated files:");

    for (const result of jetbrainsResults) {
      if (result.success && result.path) {
        const relativePath = path.relative(themeDir, result.path);
        logger.success(`  ✓ ${path.basename(result.path)}`);
      }
    }

    logger.info(`  ✓ plugin.xml`);
    logger.info("\nNext steps:");
    logger.info("  1. Package for marketplace: themebooth export intellij --package");
    logger.info("  2. Submit to JetBrains Marketplace: https://plugins.jetbrains.com/");
  } catch (error) {
    logger.error(`Failed to export theme: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Task 4.2: JetBrains package command
export async function exportIntellijPackageCommand(options: any): Promise<void> {
  try {
    const themeDir = process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    const exists = await manifestExists(paths.manifest);
    if (!exists) {
      logger.error("No manifest.json found");
      throw new Error("Manifest not found");
    }

    const validation = await validateManifestComprehensive(paths.manifest);
    if (!validation.isValid || !validation.manifest) {
      throw new Error("Invalid manifest");
    }

    const manifest = validation.manifest;
    const themeName = manifest.name;
    const packageName = options.name || `intellij-${themeName}`;
    const outputDir = options.output || path.join(themeDir, ".themebooth", `${packageName}`);
    const format = options.format || "jar";

    logger.info(`Creating JetBrains plugin package: ${packageName}`);

    // Create package directory structure
    await fs.mkdir(path.join(outputDir, "theme"), { recursive: true });
    await fs.mkdir(path.join(outputDir, "META-INF"), { recursive: true });

    // Transpile theme to temporary location
    const tempOutputDir = path.join(outputDir, ".temp");
    await fs.mkdir(tempOutputDir, { recursive: true });
    const transpilationResult = await transpileTheme(paths.manifest, tempOutputDir);

    // Copy .icls file
    const iclsFile = `${themeName}.icls`;
    const sourcePath = path.join(tempOutputDir, iclsFile);
    const destPath = path.join(outputDir, "theme", iclsFile);

    try {
      await fs.copyFile(sourcePath, destPath);
    } catch {
      logger.error(`Could not find generated ${iclsFile}`);
      throw new Error("Theme export failed");
    }

    // Copy plugin.xml
    const pluginXmlSource = path.join(tempOutputDir, "plugin.xml");
    const pluginXmlDest = path.join(outputDir, "plugin.xml");

    try {
      await fs.copyFile(pluginXmlSource, pluginXmlDest);
    } catch {
      logger.error("Could not find generated plugin.xml");
      throw new Error("Plugin metadata generation failed");
    }

    // Write MANIFEST.MF
    const manifest_content = "Manifest-Version: 1.0\nCreated-By: Themebooth\n";
    await fs.writeFile(path.join(outputDir, "META-INF", "MANIFEST.MF"), manifest_content, "utf-8");

    // Cleanup temp
    await fs.rm(tempOutputDir, { recursive: true });

    logger.success(`JetBrains plugin package created: ${outputDir}`);
    logger.info("\nPackage structure:");
    logger.info(`  plugin.xml`);
    logger.info(`  theme/`);
    logger.info(`    └── ${iclsFile}`);
    logger.info(`  META-INF/`);
    logger.info(`    └── MANIFEST.MF`);

    logger.info("\nNote: To create .jar file, compress this directory:");
    logger.info(`  zip -r ${packageName}.jar ${outputDir}`);
    logger.info("\nThen submit to: https://plugins.jetbrains.com/plugin/submit");
  } catch (error) {
    logger.error(`Failed to create package: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

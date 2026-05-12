import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, manifestExists } from "../utils/paths";
import { transpileTheme } from "../core/transpiler";
import { validateManifestComprehensive } from "../utils/validation";
import { messages } from "./messages";
import { withErrorHandler, createOutputDirectory, createDirectoryStructure, ensureFileExists } from "./command-utils";
import type { Manifest } from "../core/manifest";

interface ExportSetupResult {
  themeDir: string;
  paths: ReturnType<typeof getThemeProjectPaths>;
  manifest: Manifest;
}

async function setupExportEnvironment(themeDir?: string): Promise<ExportSetupResult> {
  const dir = themeDir || process.cwd();
  const paths = getThemeProjectPaths(dir);

  const exists = await manifestExists(paths.manifest);
  if (!exists) {
    logger.error(messages.errors.noManifestFound);
    logger.info(messages.info.manifestInitGuide);
    throw new Error(messages.errors.noManifestFound);
  }

  logger.info(messages.info.validatingManifest);
  const validation = await validateManifestComprehensive(paths.manifest);

  if (!validation.isValid) {
    logger.error(messages.errors.manifestValidationFailed + ":");
    for (const err of validation.errors) {
      const locationStr = err.line ? ` (line ${err.line}${err.column ? `, col ${err.column}` : ""})` : "";
      logger.error(`  • ${err.field}${locationStr}: ${err.message}`);
      if (err.suggestion) {
        logger.info(`    → ${err.suggestion}`);
      }
    }
    throw new Error(messages.errors.invalidManifest);
  }

  if (!validation.manifest) {
    throw new Error(messages.errors.failedToLoadManifest);
  }

  return {
    themeDir: dir,
    paths,
    manifest: validation.manifest,
  };
}

export async function exportCommand(platform: string, options: any): Promise<void> {
  return withErrorHandler(
    async () => {
      const { themeDir, paths, manifest } = await setupExportEnvironment();

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
        logger.error(messages.errors_detailed.noExportResults(platform));
        throw new Error(messages.errors.platformNotFound(platform));
      }

      // Report results
      logger.success(messages.info.themeExportedTo(outputDir));
      logger.info("\n" + messages.info.exportResults);

      for (const result of platformResults) {
        if (result.success) {
          const relativePath = path.relative(themeDir, result.path || "");
          logger.success(messages.success.platformExportSuccess(result.platform));
          logger.info(`    → ${relativePath}`);
        } else {
          logger.error(messages.errors_detailed.platformFailed(result.platform, result.error || "Unknown error"));
        }
      }

      // Show platform-specific info
      if (platform.toLowerCase() === "sublime") {
        logger.info("\n" + messages.info.sublimeFilesGenerated);
        logger.info(messages.info.sublimeColorScheme(manifest.name));
        logger.info(messages.info.sublimeThemeFile(manifest.name));
        logger.info(messages.info.sublimeMetadata);
        logger.info("\n" + messages.info.sublimeNextSteps);
        logger.info(messages.info.sublimePackageStep1);
        logger.info(messages.info.sublimePackageStep2);
      }
    },
    (error) => messages.errors.themeExportFailed(error.message)
  );
}

export async function exportSublimePackageCommand(options: any): Promise<void> {
  return withErrorHandler(
    async () => {
      const { themeDir, paths, manifest } = await setupExportEnvironment();
      const themeName = manifest.name;
      const packageName = options.name || `sublime-${themeName}`;
      const outputDir = options.output || path.join(themeDir, ".themebooth", `${packageName}`);

      logger.info(messages.info.creatingPackage(packageName));

      // Create package directory structure
      await createDirectoryStructure({
        baseDir: outputDir,
        dirs: ["themes", "color-schemes"],
      });

      // Transpile theme
      const transpilationResult = await transpileTheme(paths.manifest, path.join(outputDir, "color-schemes"));

      // Move files to appropriate locations
      const colorSchemeFile = `${themeName}.sublime-color-scheme.json`;
      const uiThemeFile = `${themeName}.sublime-theme.json`;

      // Create .no-sublime-package to mark as development package (optional)
      if (options.dev) {
        await fs.writeFile(path.join(outputDir, ".no-sublime-package"), "", "utf-8");
        logger.info(messages.info.devPackageNotice);
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

      logger.success(messages.success.packageCreated(outputDir));
      logger.info("\n" + messages.info.packageStructure);
      logger.info(`  color-schemes/`);
      logger.info(`    └── ${colorSchemeFile}`);
      logger.info(`  themes/`);
      logger.info(`    └── ${uiThemeFile}`);
      logger.info(`  packages.json`);
      logger.info("\nNext: Submit to Package Control at https://packagecontrol.io/docs/submit");
    },
    (error) => messages.errors.packageCreationFailed(error.message)
  );
}

export async function exportIntellijCommand(options: any): Promise<void> {
  return withErrorHandler(
    async () => {
      const { themeDir, paths, manifest } = await setupExportEnvironment();
      const outputDir = options.output || path.join(themeDir, ".themebooth", "output", `${manifest.name}-intellij`);
      await fs.mkdir(outputDir, { recursive: true });

      logger.info(messages.info.jetbrainsExporting(manifest.name, manifest.version));

      const transpilationResult = await transpileTheme(paths.manifest, outputDir);

      const jetbrainsResults = transpilationResult.results.filter((result) => result.platform === "JetBrains");

      if (jetbrainsResults.length === 0) {
        logger.error(messages.errors.jetbrainsExportFailed);
        throw new Error(messages.errors.jetbrainsExportFailed);
      }

      logger.success(messages.info.themeExportedTo(outputDir));
      logger.info("\n" + messages.info.generatedFiles);

      for (const result of jetbrainsResults) {
        if (result.success && result.path) {
          const relativePath = path.relative(themeDir, result.path);
          logger.success(messages.success.fileExportSuccess(path.basename(result.path)));
        }
      }

      logger.info(messages.success.pluginXmlGenerated);
      logger.info("\n" + messages.info.sublimeNextSteps);
      logger.info(messages.info.packageStep1);
      logger.info(messages.info.packageStep2);
    },
    (error) => messages.errors.themeExportFailed(error.message)
  );
}

export async function exportIntellijPackageCommand(options: any): Promise<void> {
  return withErrorHandler(
    async () => {
      const { themeDir, paths, manifest } = await setupExportEnvironment();
      const themeName = manifest.name;
      const packageName = options.name || `intellij-${themeName}`;
      const outputDir = options.output || path.join(themeDir, ".themebooth", `${packageName}`);

      logger.info(messages.info.jetbrainsPluginPackageCreating(packageName));

      // Create package directory structure
      await createDirectoryStructure({
        baseDir: outputDir,
        dirs: ["theme", "META-INF"],
      });

      // Transpile theme to temporary location
      const tempOutputDir = path.join(outputDir, ".temp");
      await fs.mkdir(tempOutputDir, { recursive: true });
      const transpilationResult = await transpileTheme(paths.manifest, tempOutputDir);

      // Copy .icls file
      const iclsFile = `${themeName}.icls`;
      const destPath = path.join(outputDir, "theme", iclsFile);
      await ensureFileExists(destPath, tempOutputDir, iclsFile);

      // Copy plugin.xml
      const pluginXmlDest = path.join(outputDir, "plugin.xml");
      await ensureFileExists(pluginXmlDest, tempOutputDir, "plugin.xml");

      // Write MANIFEST.MF
      const manifestContent = "Manifest-Version: 1.0\nCreated-By: Themebooth\n";
      await fs.writeFile(path.join(outputDir, "META-INF", "MANIFEST.MF"), manifestContent, "utf-8");

      // Cleanup temp
      await fs.rm(tempOutputDir, { recursive: true });

      logger.success(messages.info.jetbrainsPluginPackageCreated(outputDir));
      logger.info("\n" + messages.info.packageStructure);
      logger.info(`  plugin.xml`);
      logger.info(`  theme/`);
      logger.info(`    └── ${iclsFile}`);
      logger.info(`  META-INF/`);
      logger.info(`    └── MANIFEST.MF`);

      logger.info("\nNote: To create .jar file, compress this directory:");
      logger.info(messages.info.jarCompressionGuide(packageName));
      logger.info("\nThen submit to: https://plugins.jetbrains.com/plugin/submit");
    },
    (error) => messages.errors.packageCreationFailed(error.message)
  );
}

export async function exportEclipseCommand(options: any): Promise<void> {
  return withErrorHandler(
    async () => {
      const { themeDir, paths, manifest } = await setupExportEnvironment();
      const outputDir = options.output || path.join(themeDir, ".themebooth", "output", `${manifest.name}-eclipse`);
      await fs.mkdir(outputDir, { recursive: true });

      logger.info(messages.info.eclipseExporting(manifest.name, manifest.version));

      const transpilationResult = await transpileTheme(paths.manifest, outputDir);

      const eclipseResults = transpilationResult.results.filter((result) => result.platform === "Eclipse");

      if (eclipseResults.length === 0) {
        logger.error("Eclipse export failed");
        throw new Error("No Eclipse export results");
      }

      logger.success(messages.info.themeExportedTo(outputDir));
      logger.info("\n" + messages.info.eclipseFilesGenerated);

      for (const result of eclipseResults) {
        if (result.success && result.path) {
          const relativePath = path.relative(themeDir, result.path);
          logger.success(messages.success.platformExportSuccess("Eclipse"));
          logger.info(`    → ${relativePath}`);
        }
      }

      logger.info("\n" + "To import into Eclipse:");
      logger.info(messages.info.eclipseImportStep1);
      logger.info(messages.info.eclipseImportStep2);
      logger.info("\n" + messages.info.eclipseEpfImport);
    },
    (error) => messages.errors.themeExportFailed(error.message)
  );
}

export async function exportVSCodeExtensionCommand(options: any): Promise<void> {
  return withErrorHandler(
    async () => {
      const { themeDir, paths, manifest } = await setupExportEnvironment();
      const outputDir = options.output || path.join(themeDir, ".themebooth", "output", `${manifest.name}-vscode-ext`);
      await fs.mkdir(outputDir, { recursive: true });

      logger.info(messages.info.vscodeExtExporting(manifest.name, manifest.version));

      const transpilationResult = await transpileTheme(paths.manifest, outputDir);

      const vscodeExtResults = transpilationResult.results.filter(
        (result) => result.platform === "VS Code Extension"
      );

      if (vscodeExtResults.length === 0) {
        logger.error("VS Code Extension export failed");
        throw new Error("No VS Code Extension export results");
      }

      logger.success(messages.info.themeExportedTo(outputDir));
      logger.info("\n" + messages.info.vscodeExtFilesGenerated);

      for (const result of vscodeExtResults) {
        if (result.success && result.path) {
          const relativePath = path.relative(themeDir, result.path);
          logger.success(messages.success.platformExportSuccess("VS Code Extension"));
          logger.info(`    → ${relativePath}`);
        }
      }

      logger.info("\n" + "Next steps to publish:");
      logger.info(messages.info.vscodeExtPublishStep1);
      logger.info(messages.info.vscodeExtPublishStep2);
      logger.info(messages.info.vscodeExtPublishStep3);
    },
    (error) => messages.errors.themeExportFailed(error.message)
  );
}

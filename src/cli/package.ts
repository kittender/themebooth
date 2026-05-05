import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, manifestExists, readManifest } from "../utils/paths";
import { transpileTheme } from "../core/transpiler";
import { validateManifest, formatValidationErrors } from "../core/manifest";
import { validateManifestComprehensive, validateExportedTheme, validateNotepadPlusPlusXML } from "../utils/validation";

const PUBLISH_README = `# How to Publish Your Theme

## VS Code

1. Install \`vsce\` (VS Code Extension Manager):
   \`\`\`bash
   npm install -g vsce
   \`\`\`

2. Create a publisher account at https://marketplace.visualstudio.com/

3. Get a Personal Access Token:
   - Go to https://dev.azure.com/_usersSettings/tokens
   - Create a new token with "Marketplace" scope

4. Publish your theme:
   \`\`\`bash
   vsce publish --token <YOUR_TOKEN>
   \`\`\`

## Notepad++

1. Go to https://github.com/notepad-plus-plus/nppPluginList

2. Fork the repository and add your XML file to the \`xml\` folder

3. Create a pull request with your theme

## Zed

1. Install \`zed\` CLI (if available in your region)

2. Login to Zed registry:
   \`\`\`bash
   zed auth login
   \`\`\`

3. Publish your theme:
   \`\`\`bash
   zed theme publish zed-*.json
   \`\`\`

---

Generated theme files:
- VS Code: \`.json\` format
- Notepad++: \`.xml\` format
- Zed: \`zed-*.json\` format
`;

export async function packageCommand(): Promise<void> {
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

    // Comprehensive validation
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

    // Show warnings
    if (validation.warnings.length > 0) {
      logger.warn("Manifest warnings:");
      for (const warn of validation.warnings) {
        logger.warn(`  • ${warn.field}: ${warn.message}`);
      }
    }

    if (!validation.manifest) {
      throw new Error("Failed to load validated manifest");
    }

    const manifest = validation.manifest;
    logger.info(`Packaging theme: ${manifest.name}@${manifest.version}`);

    // Create output directory
    const outputDir = path.join(paths.output, manifest.name);
    await fs.mkdir(outputDir, { recursive: true });

    // Transpile
    logger.info("Transpiling to all platforms...");
    const transpilationResult = await transpileTheme(paths.manifest, outputDir);

    // Validate exports
    logger.info("Validating exported files...");
    const validationResults: Array<{ platform: string; isValid: boolean; error?: string }> = [];

    for (const result of transpilationResult.results) {
      if (result.success && result.path) {
        let exportValidation: { isValid: boolean; error?: string };

        if (result.platform === "VS Code") {
          exportValidation = await validateExportedTheme(result.path, "vscode");
        } else if (result.platform === "Notepad++") {
          exportValidation = await validateNotepadPlusPlusXML(result.path);
        } else if (result.platform === "Zed") {
          exportValidation = await validateExportedTheme(result.path, "zed");
        } else {
          exportValidation = { isValid: true };
        }

        validationResults.push({
          platform: result.platform,
          ...exportValidation,
        });
      }
    }

    // Report results
    logger.success(`Theme packaged to ./.themebooth/output/${manifest.name}/`);
    logger.info("\nExport results:");

    for (const result of transpilationResult.results) {
      const validation = validationResults.find((v) => v.platform === result.platform);
      if (result.success) {
        const relativePath = path.relative(
          process.cwd(),
          result.path || ""
        );
        if (validation && !validation.isValid) {
          logger.error(`  ⚠ ${result.platform} (validation failed)`);
          logger.info(`    → ${relativePath}`);
          logger.error(`    Error: ${validation.error}`);
        } else {
          logger.success(`  ✓ ${result.platform}`);
          logger.info(`    → ${relativePath}`);
        }
      } else {
        logger.error(`  ✗ ${result.platform}: ${result.error}`);
      }
    }

    // Write README
    const readmePath = path.join(outputDir, "PUBLISH.md");
    await fs.writeFile(readmePath, PUBLISH_README, "utf-8");
    logger.info(`\nPublishing guide: ./.themebooth/output/${manifest.name}/PUBLISH.md`);

    logger.info("\nNext steps:");
    logger.info(`  • Review theme files in ./.themebooth/output/${manifest.name}/`);
    logger.info(`  • Read PUBLISH.md for platform-specific instructions`);
    logger.info(`  • Run 'themebooth publish <platform>' for guided publishing`);
  } catch (error) {
    logger.error(`Failed to package theme: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

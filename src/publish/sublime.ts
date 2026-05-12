import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline";
import { execSync } from "child_process";
import { logger } from "../utils/logger";

interface SublimePublishConfig {
  repositoryUrl: string;
  themeName: string;
  version: string;
  author: string;
  description?: string;
}

async function promptForInput(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

async function validateGitRepository(repoUrl: string): Promise<boolean> {
  try {
    // Basic URL validation
    new URL(repoUrl);
    return repoUrl.includes("github.com");
  } catch {
    return false;
  }
}

async function generatePackageControlEntry(config: SublimePublishConfig): Promise<string> {
  const entry = {
    name: config.themeName,
    description: config.description || `${config.themeName} color scheme for Sublime Text`,
    author: config.author,
    homepage: config.repositoryUrl,
    previous_names: [],
    labels: ["color-scheme", "theme"],
    releases: [
      {
        version: config.version,
        date: new Date().toISOString().split("T")[0],
        url: `${config.repositoryUrl}/releases/tag/v${config.version}`,
        sublime_text: ">=4000",
      },
    ],
  };

  return JSON.stringify(entry, null, 2);
}

function checkGitInstalled(): boolean {
  try {
    execSync("git --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export async function handleSublimePublish(themePackagePath: string, themeName: string): Promise<void> {
  logger.title("Sublime Text Package Control Publishing");
  logger.info("");

  // Validate theme files exist
  const colorSchemeFile = path.join(themePackagePath, `${themeName}.sublime-color-scheme.json`);
  const uiThemeFile = path.join(themePackagePath, `${themeName}.sublime-theme.json`);
  const metadataFile = path.join(themePackagePath, "metadata.json");

  try {
    await fs.access(colorSchemeFile);
    logger.success(`✓ Found color scheme: ${path.basename(colorSchemeFile)}`);
  } catch {
    throw new Error(`Color scheme not found: ${colorSchemeFile}`);
  }

  try {
    await fs.access(uiThemeFile);
    logger.success(`✓ Found UI theme: ${path.basename(uiThemeFile)}`);
  } catch {
    logger.warn(`⚠ UI theme not found: ${path.basename(uiThemeFile)}`);
  }

  let metadata: any = {};
  try {
    const metadataContent = await fs.readFile(metadataFile, "utf-8");
    metadata = JSON.parse(metadataContent);
  } catch {
    logger.warn("Could not read metadata.json");
  }

  logger.info("");
  logger.info("📦 Package Control Submission Guide");
  logger.info("");

  // Get repository info
  const repoUrl = await promptForInput(
    "GitHub repository URL",
    metadata.homepage || ""
  );

  if (!repoUrl) {
    throw new Error("Repository URL is required");
  }

  if (!await validateGitRepository(repoUrl)) {
    throw new Error("Repository must be a valid GitHub URL (e.g., https://github.com/user/repo)");
  }

  const version = metadata.version || "1.0.0";
  const author = metadata.author || "Unknown";
  const description = metadata.description;

  logger.info("");
  logger.info("ℹ Submission Details:");
  logger.info(`  Theme: ${themeName}`);
  logger.info(`  Repository: ${repoUrl}`);
  logger.info(`  Version: ${version}`);
  logger.info(`  Author: ${author}`);
  logger.info("");

  // Generate Package Control entry
  const entry = await generatePackageControlEntry({
    repositoryUrl: repoUrl,
    themeName,
    version,
    author,
    description,
  });

  logger.info("📋 Package Control Entry (add to repository.json):");
  logger.info("");
  logger.info(entry);
  logger.info("");

  // Save entry to file
  const entryFilePath = path.join(process.cwd(), `${themeName}-package-control.json`);
  await fs.writeFile(entryFilePath, entry, "utf-8");
  logger.success(`✓ Entry saved to: ${entryFilePath}`);

  logger.info("");
  logger.info("📚 Next Steps:");
  logger.info("  1. Create a GitHub release with your theme files:");
  logger.info(`     git tag v${version}`);
  logger.info(`     git push origin v${version}`);
  logger.info("");
  logger.info("  2. Upload theme files to the release");
  logger.info("");
  logger.info("  3. Fork Package Control channel:");
  logger.info("     https://github.com/wbond/package_control_channel");
  logger.info("");
  logger.info("  4. Add entry to repository.json in the fork");
  logger.info(`     Copy the entry from: ${entryFilePath}`);
  logger.info("");
  logger.info("  5. Create a pull request with:");
  logger.info("     • Theme name and description");
  logger.info("     • GitHub repository URL");
  logger.info("     • Release tag information");
  logger.info("");
  logger.info("  6. Submit your PR:");
  logger.info("     https://github.com/wbond/package_control_channel/pulls");
  logger.info("");
  logger.info("ℹ Reference: https://packagecontrol.io/docs/submit");
}

import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline";
import { logger } from "../utils/logger";

async function promptForToken(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n🔑 Enter your VS Code Personal Access Token (hidden): ",
      (token) => {
        rl.close();
        resolve(token.trim());
      }
    );
  });
}

function checkVsceInstalled(): boolean {
  try {
    execSync("vsce --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function publishToVSCode(
  themePath: string,
  themeName: string,
  token: string
): Promise<{ success: boolean; publisherName?: string; version?: string; url?: string }> {
  try {
    logger.info("📦 Running vsce publish...");
    const output = execSync(`vsce publish --token "${token}" --packagePath "${themePath}"`, {
      cwd: path.dirname(themePath),
      encoding: "utf-8",
    });

    logger.success("✓ Published to VS Code Marketplace!");

    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : "1.0.0";

    const publisherMatch = output.match(/Successfully published '([^']+)'/);
    const publisherName = publisherMatch ? publisherMatch[1] : themeName;

    const url = `https://marketplace.visualstudio.com/items?itemName=${publisherName}`;

    return {
      success: true,
      publisherName,
      version,
      url,
    };
  } catch (error: any) {
    const errorMsg = error.stdout || error.message;
    if (errorMsg.includes("Invalid Personal Access Token")) {
      throw new Error("Invalid Personal Access Token. Check credentials and try again.");
    }
    if (errorMsg.includes("already published")) {
      throw new Error(
        "Version already published. Increment version in manifest or package.json"
      );
    }
    throw new Error(`vsce publish failed: ${errorMsg}`);
  }
}

export async function handleVSCodePublish(themePackagePath: string, themeName: string): Promise<void> {
  logger.title("VS Code Marketplace Publishing");
  logger.info("");

  // Check vsce installed
  if (!checkVsceInstalled()) {
    logger.error("vsce not found. Install with:");
    logger.info("  npm install -g @vscode/vsce");
    logger.info("");
    logger.info("Or follow: https://github.com/microsoft/vscode-vsce#installation");
    throw new Error("vsce CLI not installed");
  }

  // Check publisher name in package.json
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    if (!pkg.publisher) {
      logger.warn("⚠ No publisher field in package.json");
      logger.info("Add to package.json:");
      logger.info('  "publisher": "your-publisher-name"');
      throw new Error("Publisher not configured");
    }
  } catch (error: any) {
    if (error.message === "Publisher not configured") throw error;
    logger.warn("Could not read package.json, continuing...");
  }

  // Find theme.json file
  const themeFile = path.join(themePackagePath, `${themeName}.json`);
  try {
    await fs.access(themeFile);
  } catch {
    throw new Error(`Theme file not found: ${themeFile}`);
  }

  logger.info("ℹ About to publish to VS Code Marketplace");
  logger.info(`  Theme: ${themeName}`);
  logger.info(`  File: ${themeFile}`);
  logger.info("");

  // Get token
  const token = await promptForToken();
  if (!token) {
    throw new Error("Token required to publish");
  }

  // Publish
  const result = await publishToVSCode(themeFile, themeName, token);

  logger.success("");
  logger.success(`Marketplace URL: ${result.url}`);
  logger.success(`Published version: ${result.version}`);
}

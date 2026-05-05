import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline";
import { logger } from "../utils/logger";

interface ZedThemePayload {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  theme: Record<string, any>;
}

async function promptForCredentials(): Promise<{ username: string; token: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("\n👤 Zed username: ", (username) => {
      rl.question("🔑 Zed API token (from https://zed.dev/account): ", (token) => {
        rl.close();
        resolve({ username: username.trim(), token: token.trim() });
      });
    });
  });
}

async function publishToZedRegistry(
  themeData: ZedThemePayload,
  username: string,
  token: string
): Promise<{ success: boolean; themeId: string; registryUrl: string }> {
  try {
    // Build Zed API endpoint
    const endpoint = `https://zed.dev/api/themes`;

    // Prepare request
    const body = JSON.stringify(themeData);
    const authHeader = Buffer.from(`${username}:${token}`).toString("base64");

    // Make POST request using native fetch
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error("Invalid Zed credentials");
      }
      if (response.status === 409) {
        throw new Error("Theme already exists. Update version and try again.");
      }
      throw new Error(`Zed API error (${response.status}): ${errorText}`);
    }

    const result = await response.json() as { id?: string };
    const themeId = result.id || themeData.id;

    return {
      success: true,
      themeId,
      registryUrl: `https://zed.dev/extensions/themes/${username}/${themeData.id}`,
    };
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to publish to Zed: ${error}`);
  }
}

export async function handleZedPublish(
  themePackagePath: string,
  themeName: string,
  manifest: any
): Promise<void> {
  logger.title("Zed Theme Registry Publishing");
  logger.info("");

  // Find theme file
  const themeFile = path.join(themePackagePath, `zed-${themeName}.json`);
  try {
    await fs.access(themeFile);
  } catch {
    throw new Error(`Zed theme file not found: ${themeFile}`);
  }

  // Read theme data
  const themeContent = JSON.parse(await fs.readFile(themeFile, "utf-8"));

  logger.info("ℹ Publishing to Zed Theme Registry");
  logger.info(`  Theme: ${themeName}`);
  logger.info(`  Author: ${manifest.author || "unknown"}`);
  logger.info("");
  logger.info("Get your API token at: https://zed.dev/account");
  logger.info("");

  // Get credentials
  const { username, token } = await promptForCredentials();
  if (!username || !token) {
    throw new Error("Zed credentials required");
  }

  // Prepare payload
  const payload: ZedThemePayload = {
    id: themeName,
    name: manifest.name || themeName,
    description: manifest.description || "A custom theme",
    author: manifest.author || "Unknown",
    version: manifest.version || "1.0.0",
    theme: themeContent,
  };

  // Publish
  logger.info("📦 Publishing to Zed registry...");
  const result = await publishToZedRegistry(payload, username, token);

  logger.success("");
  logger.success("✓ Published to Zed Theme Registry!");
  logger.success(`Registry URL: ${result.registryUrl}`);
  logger.success(`Theme ID: ${result.themeId}`);
}

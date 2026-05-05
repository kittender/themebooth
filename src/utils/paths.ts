import * as path from "path";
import * as fs from "fs/promises";

export interface ThemeProjectPaths {
  root: string;
  manifest: string;
  preview: string;
  cache: string;
  output: string;
}

/**
 * Gets all important paths for a theme project
 */
export function getThemeProjectPaths(themeDir: string): ThemeProjectPaths {
  const root = path.resolve(themeDir);
  return {
    root,
    manifest: path.join(root, "manifest.json"),
    preview: path.join(root, "preview.html"),
    cache: path.join(root, ".themebooth", "cache"),
    output: path.join(root, ".themebooth", "output"),
  };
}

/**
 * Ensures theme project directory structure exists
 */
export async function ensureThemeProjectStructure(paths: ThemeProjectPaths): Promise<void> {
  await fs.mkdir(paths.root, { recursive: true });
  await fs.mkdir(paths.cache, { recursive: true });
  await fs.mkdir(paths.output, { recursive: true });
}

/**
 * Checks if a manifest file exists at a location
 */
export async function manifestExists(manifestPath: string): Promise<boolean> {
  try {
    await fs.access(manifestPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads a manifest file
 */
export async function readManifest(manifestPath: string): Promise<Record<string, unknown>> {
  const content = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(content);
}

/**
 * Writes a manifest file
 */
export async function writeManifest(
  manifestPath: string,
  manifest: Record<string, unknown>
): Promise<void> {
  const content = JSON.stringify(manifest, null, 2);
  await fs.writeFile(manifestPath, content, "utf-8");
}

/**
 * Ensures a directory is empty or doesn't exist
 */
export async function ensureEmptyDirectory(dirPath: string): Promise<void> {
  try {
    const stat = await fs.stat(dirPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(dirPath);
      if (files.length > 0) {
        throw new Error(`Directory ${dirPath} is not empty`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  await fs.mkdir(dirPath, { recursive: true });
}

import * as path from "path";
import * as fs from "fs/promises";
import { logger } from "../utils/logger";

export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  errorFormatter: (error: Error) => string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = errorFormatter(error instanceof Error ? error : new Error(String(error)));
    logger.error(message);
    throw error;
  }
}

export interface OutputDirOptions {
  baseDir: string;
  defaultName: string;
  subdir?: string;
}

export async function createOutputDirectory(options: OutputDirOptions): Promise<string> {
  const outputDir = path.join(options.baseDir, ".themebooth", options.subdir || "", options.defaultName);
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

export interface DirectoryStructureOptions {
  baseDir: string;
  dirs: string[];
}

export async function createDirectoryStructure(options: DirectoryStructureOptions): Promise<void> {
  for (const dir of options.dirs) {
    await fs.mkdir(path.join(options.baseDir, dir), { recursive: true });
  }
}

export async function ensureFileExists(filePath: string, sourceDir: string, fileName: string): Promise<void> {
  const sourcePath = path.join(sourceDir, fileName);
  try {
    await fs.copyFile(sourcePath, filePath);
  } catch {
    throw new Error(`Could not find generated ${fileName}`);
  }
}

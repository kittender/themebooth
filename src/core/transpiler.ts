import * as fs from "fs/promises";
import * as path from "path";
import { Manifest, validateManifest } from "./manifest";
import { resolveVariables, interpolateManifest, validateVariableReferences } from "./variables";
import { exportVSCode } from "../exporters/vscode";
import { exportNotepadPlus } from "../exporters/notepad-plus";
import { exportZed } from "../exporters/zed";
import { logger } from "../utils/logger";

export interface TranspilationResult {
  success: boolean;
  platform: string;
  path?: string;
  error?: string;
}

export interface TranspilationResults {
  manifest: Manifest;
  results: TranspilationResult[];
}

export async function transpileTheme(
  manifestPath: string,
  outputDir: string
): Promise<TranspilationResults> {
  // Read and parse manifest
  const manifestContent = await fs.readFile(manifestPath, "utf-8");
  let manifestData: unknown;
  try {
    manifestData = JSON.parse(manifestContent);
  } catch (error) {
    throw new Error(`Invalid JSON in manifest: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Validate manifest
  const validation = validateManifest(manifestData);
  if (!validation.success) {
    const errors = validation.errors.map((e) => `${e.field}: ${e.message}`).join("\n");
    throw new Error(`Manifest validation failed:\n${errors}`);
  }

  const manifest = validation.data;

  // Validate variable references
  const varRefErrors = validateVariableReferences(manifest);
  if (varRefErrors.length > 0) {
    const errors = varRefErrors.map((e) => `${e.location}: ${e.message}`).join("\n");
    throw new Error(`Variable validation failed:\n${errors}`);
  }

  // Resolve variables
  const variableResolution = resolveVariables(manifest);
  if (!variableResolution.success) {
    throw new Error(`Variable resolution failed: ${variableResolution.error.message}`);
  }

  // Interpolate manifest
  const interpolated = interpolateManifest(manifest, variableResolution.variables);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  const results: TranspilationResult[] = [];

  // Export to VS Code
  try {
    const vscodeTheme = exportVSCode(interpolated);
    const vscodeOutputPath = path.join(outputDir, `${manifest.name}.json`);
    await fs.writeFile(vscodeOutputPath, JSON.stringify(vscodeTheme, null, 2), "utf-8");
    results.push({
      success: true,
      platform: "VS Code",
      path: vscodeOutputPath,
    });
  } catch (error) {
    results.push({
      success: false,
      platform: "VS Code",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Export to Notepad++
  try {
    const notepadXml = exportNotepadPlus(interpolated);
    const notepadOutputPath = path.join(outputDir, `${manifest.name}.xml`);
    await fs.writeFile(notepadOutputPath, notepadXml, "utf-8");
    results.push({
      success: true,
      platform: "Notepad++",
      path: notepadOutputPath,
    });
  } catch (error) {
    results.push({
      success: false,
      platform: "Notepad++",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Export to Zed
  try {
    const zedTheme = exportZed(interpolated);
    const zedOutputPath = path.join(outputDir, `zed-${manifest.name}.json`);
    await fs.writeFile(zedOutputPath, JSON.stringify(zedTheme, null, 2), "utf-8");
    results.push({
      success: true,
      platform: "Zed",
      path: zedOutputPath,
    });
  } catch (error) {
    results.push({
      success: false,
      platform: "Zed",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Copy manifest to output
  const manifestOutputPath = path.join(outputDir, "manifest.json");
  await fs.writeFile(manifestOutputPath, JSON.stringify(interpolated, null, 2), "utf-8");

  return {
    manifest: interpolated,
    results,
  };
}

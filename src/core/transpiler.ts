import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { Manifest, validateManifest } from "./manifest";
import { resolveVariables, interpolateManifest, validateVariableReferences } from "./variables";
import { loadOverlay, resolveOverlayVariables, mergeOverlayIntoManifest, EditorOverlay } from "./overlay";
import { resolveInheritance } from "./inheritance";
import { resolveComputedColors } from "./computed";
import { exportVSCode } from "../exporters/vscode";
import { exportNotepadPlus } from "../exporters/notepad-plus";
import { exportZed } from "../exporters/zed";
import { exportBrackets } from "../exporters/brackets";
import { exportSublime } from "../exporters/sublime";
import { exportVim } from "../exporters/vim";
import { exportAtom } from "../exporters/atom";
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

function applyPresetOverrides(manifest: Manifest, presetName?: string): Manifest {
  if (!presetName || !manifest.presets || !manifest.presets[presetName]) {
    return manifest;
  }

  const preset = manifest.presets[presetName];
  const result = { ...manifest };

  // Apply variable overrides
  if (preset.variableOverrides) {
    result.variables = { ...result.variables, ...preset.variableOverrides };
  }

  // Apply token overrides
  if (preset.tokenOverrides) {
    result.tokens = { ...result.tokens };
    for (const [scope, overrides] of Object.entries(preset.tokenOverrides)) {
      const existingToken = result.tokens[scope] || {};
      result.tokens[scope] = { ...existingToken, ...overrides };
    }
  }

  // Apply color overrides
  if (preset.softwareOverrides) {
    for (const [software, colorOverrides] of Object.entries(preset.softwareOverrides)) {
      // This will be applied during editor-specific export
      if (software === "all") {
        result.colors = { ...result.colors, ...colorOverrides };
      }
    }
  }

  return result;
}

export async function transpileTheme(
  manifestPath: string,
  outputDir: string,
  presetName?: string
): Promise<TranspilationResults> {
  // Load and resolve inheritance
  let manifestData: unknown;
  try {
    manifestData = await resolveInheritance(manifestPath);
  } catch (error) {
    throw new Error(`Failed to load manifest: ${error instanceof Error ? error.message : String(error)}`);
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

  // Resolve computed colors (augment variable map)
  let extendedVariables = variableResolution.variables;
  if (manifest.computed && Object.keys(manifest.computed).length > 0) {
    extendedVariables = resolveComputedColors(manifest.computed, variableResolution.variables);
  }

  // Apply preset overrides if specified
  let manifestWithPreset = applyPresetOverrides(manifest, presetName);

  // Interpolate manifest using extended variable map
  const interpolated = interpolateManifest(manifestWithPreset, extendedVariables);

  // Load editor overlays
  const manifestDir = path.dirname(manifestPath);
  const vsCodeOverlay = loadOverlay(path.join(manifestDir, "vscode.json"));
  const bracketsOverlay = loadOverlay(path.join(manifestDir, "brackets.json"));
  const sublimeOverlay = loadOverlay(path.join(manifestDir, "sublime.json"));
  const vimOverlay = loadOverlay(path.join(manifestDir, "vim.json"));
  const atomOverlay = loadOverlay(path.join(manifestDir, "atom.json"));

  // Resolve variables in overlays (using extended variables that include computed colors)
  const resolvedVsCodeOverlay = vsCodeOverlay ? resolveOverlayVariables(vsCodeOverlay, extendedVariables) : null;
  const resolvedBracketsOverlay = bracketsOverlay ? resolveOverlayVariables(bracketsOverlay, extendedVariables) : null;
  const resolvedSublimeOverlay = sublimeOverlay ? resolveOverlayVariables(sublimeOverlay, extendedVariables) : null;
  const resolvedVimOverlay = vimOverlay ? resolveOverlayVariables(vimOverlay, extendedVariables) : null;
  const resolvedAtomOverlay = atomOverlay ? resolveOverlayVariables(atomOverlay, extendedVariables) : null;

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  const results: TranspilationResult[] = [];

  // Export to VS Code
  try {
    const vsCodeManifest = resolvedVsCodeOverlay
      ? mergeOverlayIntoManifest(interpolated, resolvedVsCodeOverlay)
      : interpolated;
    const vscodeTheme = exportVSCode(vsCodeManifest);
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

  // Export to Brackets (if overlay exists)
  if (resolvedBracketsOverlay) {
    try {
      const bracketsLess = exportBrackets(interpolated, resolvedBracketsOverlay);
      const bracketsOutputPath = path.join(outputDir, `${manifest.name}.less`);
      await fs.writeFile(bracketsOutputPath, bracketsLess, "utf-8");
      results.push({
        success: true,
        platform: "Brackets",
        path: bracketsOutputPath,
      });
    } catch (error) {
      results.push({
        success: false,
        platform: "Brackets",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Export to Sublime
  try {
    const sublimeManifest = resolvedSublimeOverlay
      ? mergeOverlayIntoManifest(interpolated, resolvedSublimeOverlay)
      : interpolated;
    const sublimeTheme = exportSublime(sublimeManifest, resolvedSublimeOverlay || { inherits: "" });
    const sublimeOutputPath = path.join(outputDir, `${manifest.name}.sublime-color-scheme.json`);
    await fs.writeFile(sublimeOutputPath, JSON.stringify(sublimeTheme, null, 2), "utf-8");
    results.push({
      success: true,
      platform: "Sublime Text",
      path: sublimeOutputPath,
    });
  } catch (error) {
    results.push({
      success: false,
      platform: "Sublime Text",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Export to Vim
  try {
    const vimManifest = resolvedVimOverlay
      ? mergeOverlayIntoManifest(interpolated, resolvedVimOverlay)
      : interpolated;
    const vimScript = exportVim(vimManifest, resolvedVimOverlay || { inherits: "" });
    const vimOutputPath = path.join(outputDir, `${manifest.name}.vim`);
    await fs.writeFile(vimOutputPath, vimScript, "utf-8");
    results.push({
      success: true,
      platform: "Vim",
      path: vimOutputPath,
    });
  } catch (error) {
    results.push({
      success: false,
      platform: "Vim",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Export to Atom
  try {
    const atomManifest = resolvedAtomOverlay
      ? mergeOverlayIntoManifest(interpolated, resolvedAtomOverlay)
      : interpolated;
    const atomTheme = exportAtom(atomManifest, resolvedAtomOverlay || { inherits: "" });
    const atomOutputPath = path.join(outputDir, `${manifest.name}.atom-color-scheme.json`);
    await fs.writeFile(atomOutputPath, JSON.stringify(atomTheme, null, 2), "utf-8");
    results.push({
      success: true,
      platform: "Atom",
      path: atomOutputPath,
    });
  } catch (error) {
    results.push({
      success: false,
      platform: "Atom",
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

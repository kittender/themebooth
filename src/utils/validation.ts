import * as fs from "fs/promises";
import * as path from "path";
import { Manifest, validateManifest } from "../core/manifest";
import { resolveVariables, validateVariableReferences } from "../core/variables";

export interface ValidationResult {
  isValid: boolean;
  manifest?: Manifest;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export interface ValidationMessage {
  severity: "error" | "warning";
  field: string;
  message: string;
  suggestion?: string;
  line?: number;
  column?: number;
}

/**
 * Parse JSON with line/column information on error
 */
export function parseManifestJSON(content: string): { success: true; data: any } | { success: false; error: ValidationMessage } {
  try {
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      const lines = content.split("\n");
      let line = 1;
      let column = 1;
      let position = 0;

      // Try to extract line/column from SyntaxError message
      const match = error.message.match(/position (\d+)/);
      if (match) {
        position = parseInt(match[1], 10);
        for (let i = 0; i < position && i < content.length; i++) {
          if (content[i] === "\n") {
            line++;
            column = 1;
          } else {
            column++;
          }
        }
      }

      return {
        success: false,
        error: {
          severity: "error",
          field: "manifest.json",
          message: `JSON parsing error: ${error.message}`,
          suggestion: "Check your JSON syntax - common issues: trailing comma, missing quotes, mismatched braces",
          line,
          column,
        },
      };
    }

    return {
      success: false,
      error: {
        severity: "error",
        field: "manifest.json",
        message: `Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}

/**
 * Comprehensive manifest validation including variables
 */
export async function validateManifestComprehensive(manifestPath: string): Promise<ValidationResult> {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  let manifest: Manifest | undefined;

  // Read file
  try {
    const content = await fs.readFile(manifestPath, "utf-8");

    // Parse JSON
    const parseResult = parseManifestJSON(content);
    if (!parseResult.success) {
      errors.push(parseResult.error);
      return { isValid: false, errors, warnings };
    }

    // Validate against schema
    const schemaValidation = validateManifest(parseResult.data);
    if (!schemaValidation.success) {
      for (const err of schemaValidation.errors) {
        errors.push({
          severity: "error",
          field: err.field,
          message: err.message,
          suggestion: getSuggestionForError(err.field, err.message),
        });
      }
    } else {
      manifest = schemaValidation.data;

      // Additional variable validation
      const varErrors = validateVariableReferences(manifest);
      for (const err of varErrors) {
        errors.push({
          severity: "error",
          field: err.location,
          message: err.message,
          suggestion: `Define variable $${err.variable} in the "variables" section`,
        });
      }

      // Check for unused variables (warning)
      const usedVars = new Set<string>();
      for (const color of Object.values(manifest.colors || {})) {
        extractVariableNames(String(color)).forEach((v) => usedVars.add(v));
      }
      for (const token of Object.values(manifest.tokens || {})) {
        for (const val of Object.values(token)) {
          extractVariableNames(String(val)).forEach((v) => usedVars.add(v));
        }
      }

      for (const varName of Object.keys(manifest.variables || {})) {
        if (!usedVars.has(varName)) {
          warnings.push({
            severity: "warning",
            field: `variables.${varName}`,
            message: `Unused variable $${varName}`,
          });
        }
      }
    }
  } catch (error) {
    errors.push({
      severity: "error",
      field: "manifest.json",
      message: `Failed to read manifest: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return {
    isValid: errors.length === 0,
    manifest,
    errors,
    warnings,
  };
}

/**
 * Validate generated theme file format
 */
export async function validateExportedTheme(
  filePath: string,
  platform: "vscode" | "zed"
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    if (platform === "vscode") {
      // Basic VS Code theme structure check
      if (!data.name || typeof data.name !== "string") {
        return { isValid: false, error: "VS Code theme missing 'name' field" };
      }
      if (!data.colors || typeof data.colors !== "object") {
        return { isValid: false, error: "VS Code theme missing 'colors' object" };
      }
      if (!Array.isArray(data.tokenColors)) {
        return { isValid: false, error: "VS Code theme 'tokenColors' must be an array" };
      }
    } else if (platform === "zed") {
      // Basic Zed theme structure check
      if (!data.name || typeof data.name !== "string") {
        return { isValid: false, error: "Zed theme missing 'name' field" };
      }
      if (!data.appearance || !["light", "dark"].includes(data.appearance)) {
        return { isValid: false, error: "Zed theme must have 'appearance' as 'light' or 'dark'" };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate exported theme: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate XML well-formedness for Notepad++
 */
export async function validateNotepadPlusPlusXML(filePath: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const content = await fs.readFile(filePath, "utf-8");

    // Check for required Notepad++ elements
    if (!content.includes("<NotepadPlus>") || !content.includes("</NotepadPlus>")) {
      return { isValid: false, error: "Missing <NotepadPlus> root element" };
    }

    // Check XML declaration
    if (!content.includes("<?xml")) {
      return { isValid: false, error: "Missing XML declaration" };
    }

    // Basic bracket matching
    let bracketDepth = 0;
    for (const char of content) {
      if (char === "<") bracketDepth++;
      if (char === ">") bracketDepth--;
      if (bracketDepth < 0) {
        return { isValid: false, error: "Mismatched XML brackets" };
      }
    }

    if (bracketDepth !== 0) {
      return { isValid: false, error: "Unclosed XML tags" };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate Notepad++ XML: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check if directory already exists and provide guidance
 */
export async function checkDirectoryExists(dirPath: string): Promise<{ exists: boolean; isEmpty: boolean }> {
  try {
    const stat = await fs.stat(dirPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(dirPath);
      return { exists: true, isEmpty: files.length === 0 };
    }
    return { exists: false, isEmpty: false };
  } catch {
    return { exists: false, isEmpty: false };
  }
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = require("net").createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port, "localhost");
  });
}

/**
 * Find next available port
 */
export async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find available port after ${maxAttempts} attempts starting from ${startPort}`);
}

// Helper functions

function extractVariableNames(value: string): string[] {
  const names: string[] = [];
  const regex = /\$(\w+)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function getSuggestionForError(field: string, message: string): string | undefined {
  if (field === "name") {
    return "Provide a descriptive theme name (e.g., 'My Dark Theme')";
  }
  if (field === "author") {
    return "Add your name or organization as the author";
  }
  if (field === "version") {
    return "Use semantic versioning format: MAJOR.MINOR.PATCH (e.g., 1.0.0)";
  }
  if (message.includes("hex color")) {
    return "Use hex color format: #RRGGBB (6 digits) or #RGB (3 digits) or $variableName";
  }
  if (message.includes("token properties")) {
    return "Valid token properties: foreground, background, fontStyle, fontWeight, opacity";
  }
  if (message.includes("Circular")) {
    return "Check your variable definitions - they form a circular reference chain";
  }
  if (message.includes("Undefined")) {
    return "Define the variable in the 'variables' section before using it";
  }
  return undefined;
}

import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger";
import { Manifest, validateManifest } from "../core/manifest";
import { parseManifestJSON, ValidationMessage } from "../utils/validation";
import { parseAndNormalizeColor, validateColorFormat } from "../core/colors";
import { extractVariableReferences } from "../core/schemas";
import { exportVSCode } from "../exporters/vscode";
import { exportZed } from "../exporters/zed";
import { exportNotepadPlus } from "../exporters/notepad-plus";

interface ValidateOptions {
  fix?: boolean;
  ci?: boolean;
}

interface ValidationStats {
  variables: number;
  colors: number;
  tokens: number;
  semanticTokens: number;
  languageTokens: number;
  presets: number;
  extends: boolean;
  computed: number;
  colorConversions: number;
}

interface CIOutput {
  valid: boolean;
  errors: Array<{
    severity: "error" | "warning";
    field: string;
    message: string;
    suggestion?: string;
    line?: number;
    column?: number;
  }>;
  warnings: Array<{
    severity: "error" | "warning";
    field: string;
    message: string;
    suggestion?: string;
    line?: number;
    column?: number;
  }>;
  stats: ValidationStats;
  conversions?: Array<{ line: number; field: string; from: string; to: string }>;
}

export async function validateCommand(manifestPath?: string, options: ValidateOptions = {}): Promise<void> {
  const resolvedPath = path.resolve(manifestPath || "./manifest.json");

  try {
    const content = await fs.readFile(resolvedPath, "utf-8");
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];
    const conversions: Array<{ line: number; field: string; from: string; to: string }> = [];
    let manifest: Manifest | undefined;

    // Parse JSON
    const parseResult = parseManifestJSON(content);
    if (!parseResult.success) {
      if (options.ci) {
        console.log(
          JSON.stringify(
            {
              valid: false,
              errors: [parseResult.error],
              warnings: [],
              stats: getStats(undefined),
            } as CIOutput,
            null,
            2
          )
        );
      } else {
        logger.error("manifest.json invalid (1 error)");
        console.log(`\n  ERROR [line ${parseResult.error.line}, col ${parseResult.error.column}]: ${parseResult.error.message}`);
        if (parseResult.error.suggestion) {
          console.log(`    ${parseResult.error.suggestion}`);
        }
      }
      process.exit(1);
    }

    // Pre-validate and normalize colors before schema validation
    const preValidationData = JSON.parse(JSON.stringify(parseResult.data));
    normalizeColorsInManifest(preValidationData, conversions);

    // Validate schema
    const schemaValidation = validateManifest(preValidationData);
    if (!schemaValidation.success) {
      schemaValidation.errors.forEach((err) => {
        errors.push({
          severity: "error",
          field: err.field || "unknown",
          message: err.message,
        });
      });
    } else {
      manifest = schemaValidation.data;

      // Validate colors with conversion
      const colorErrors = validateColors(manifest, conversions);
      errors.push(...colorErrors.errors);
      warnings.push(...colorErrors.warnings);

      // Validate variables
      const varErrors = validateVariables(manifest);
      errors.push(...varErrors.errors);
      warnings.push(...varErrors.warnings);

      // Validate computed colors
      const computedErrors = validateComputedColors(manifest);
      errors.push(...computedErrors);

      // Validate tokens
      const tokenErrors = validateTokens(manifest);
      errors.push(...tokenErrors);

      // Validate semantic tokens
      const semanticErrors = validateSemanticTokens(manifest);
      errors.push(...semanticErrors);

      // Validate language tokens
      const languageErrors = validateLanguageTokens(manifest);
      errors.push(...languageErrors);

      // Validate presets
      const presetErrors = validatePresets(manifest);
      errors.push(...presetErrors);

      // Validate extends
      if (manifest.extends) {
        const extendsErrors = await validateExtends(manifest.extends, resolvedPath);
        errors.push(...extendsErrors);
      }

      // Dry-run exporter validation
      const exporterErrors = validateExporters(manifest);
      errors.push(...exporterErrors);
    }

    // Generate output
    if (options.ci) {
      const output: CIOutput = {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: getStats(manifest),
      };
      if (conversions.length > 0) {
        output.conversions = conversions;
      }
      console.log(JSON.stringify(output, null, 2));
    } else {
      printValidationResult(errors, warnings, manifest, conversions, options.fix);
    }

    // Apply fixes if requested
    if (options.fix && conversions.length > 0) {
      // preValidationData already has conversions applied
      await fs.writeFile(resolvedPath, JSON.stringify(preValidationData, null, 2) + "\n");
      if (!options.ci) {
        logger.success(`manifest.json fixed (${conversions.length} conversions)`);
        conversions.forEach((c) => {
          console.log(`  • ${c.field}: ${c.from} → ${c.to}`);
        });
        console.log(`  Written back to manifest.json`);
      }
    }

    // Exit with appropriate code
    if (errors.length > 0) {
      process.exit(1);
    } else if (warnings.length > 0) {
      process.exit(2);
    }
  } catch (error) {
    if (options.ci) {
      console.log(
        JSON.stringify(
          {
            valid: false,
            errors: [
              {
                severity: "error",
                field: "manifest.json",
                message: `Failed to read manifest: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            warnings: [],
            stats: getStats(undefined),
          } as CIOutput,
          null,
          2
        )
      );
    } else {
      logger.error(`Failed to read manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

function validateColors(
  manifest: Manifest,
  conversions: Array<{ line: number; field: string; from: string; to: string }>
): { errors: ValidationMessage[]; warnings: ValidationMessage[] } {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  if (!manifest.colors) return { errors, warnings };

  Object.entries(manifest.colors).forEach(([key, value]) => {
    if (value === null) return;

    // Skip variable references
    if (value.startsWith("$")) {
      return;
    }

    // Try to parse and normalize
    const result = parseAndNormalizeColor(value);
    if (result) {
      if (result.changes.length > 0) {
        conversions.push({
          line: 0, // TODO: get actual line number from source
          field: `colors.${key}`,
          from: value,
          to: result.hex,
        });
      }
    } else {
      const format = validateColorFormat(value);
      if (!format.valid) {
        errors.push({
          severity: "error",
          field: `colors.${key}`,
          message: `Invalid color format "${value}"`,
          suggestion: format.suggestion || "Use #RRGGBB, rgb(r,g,b), or $variableName",
        });
      }
    }
  });

  return { errors, warnings };
}

function validateVariables(manifest: Manifest): { errors: ValidationMessage[]; warnings: ValidationMessage[] } {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  if (!manifest.variables) return { errors, warnings };

  // Check for circular dependencies
  const visited = new Set<string>();
  const recStack = new Set<string>();

  const hasCycle = (varName: string): boolean => {
    visited.add(varName);
    recStack.add(varName);

    const refs = extractVariableReferences(String(manifest.variables[varName]));
    for (const ref of refs) {
      if (!visited.has(ref)) {
        if (hasCycle(ref)) {
          return true;
        }
      } else if (recStack.has(ref)) {
        return true;
      }
    }

    recStack.delete(varName);
    return false;
  };

  for (const varName of Object.keys(manifest.variables)) {
    visited.clear();
    recStack.clear();
    if (hasCycle(varName)) {
      errors.push({
        severity: "error",
        field: `variables.${varName}`,
        message: `Circular variable dependency detected`,
        suggestion: "Break the reference cycle in your variable definitions",
      });
    }
  }

  // Check for unused variables
  const usedVars = new Set<string>();

  // Collect all references from colors
  if (manifest.colors) {
    Object.values(manifest.colors).forEach((val) => {
      if (val) {
        extractVariableReferences(String(val)).forEach((v) => usedVars.add(v));
      }
    });
  }

  // Collect from tokens
  if (manifest.tokens) {
    Object.values(manifest.tokens).forEach((settings) => {
      Object.values(settings).forEach((val) => {
        extractVariableReferences(String(val)).forEach((v) => usedVars.add(v));
      });
    });
  }

  // Collect from semantic tokens
  if (manifest.semanticTokens) {
    Object.values(manifest.semanticTokens).forEach((settings) => {
      Object.values(settings).forEach((val) => {
        extractVariableReferences(String(val)).forEach((v) => usedVars.add(v));
      });
    });
  }

  // Collect from language tokens
  if (manifest.languageTokens) {
    Object.values(manifest.languageTokens).forEach((langTokens) => {
      Object.values(langTokens).forEach((settings) => {
        Object.values(settings).forEach((val) => {
          extractVariableReferences(String(val)).forEach((v) => usedVars.add(v));
        });
      });
    });
  }

  // Collect from presets
  if (manifest.presets) {
    Object.values(manifest.presets).forEach((preset) => {
      if (preset.variableOverrides) {
        Object.values(preset.variableOverrides).forEach((val) => {
          extractVariableReferences(String(val)).forEach((v) => usedVars.add(v));
        });
      }
    });
  }

  // Check unused
  for (const varName of Object.keys(manifest.variables)) {
    if (!usedVars.has(varName)) {
      warnings.push({
        severity: "warning",
        field: `variables.${varName}`,
        message: `Unused variable $${varName}`,
        suggestion: "Safe to remove if not needed",
      });
    }
  }

  return { errors, warnings };
}

function validateComputedColors(manifest: Manifest): ValidationMessage[] {
  const errors: ValidationMessage[] = [];

  if (!manifest.computed) return errors;

  Object.entries(manifest.computed).forEach(([name, entry]) => {
    // Validate base
    if (entry.base.startsWith("$")) {
      if (!manifest.variables?.[entry.base.slice(1)]) {
        errors.push({
          severity: "error",
          field: `computed.${name}`,
          message: `Base variable ${entry.base} is undefined`,
        });
      }
    } else if (!parseAndNormalizeColor(entry.base)) {
      errors.push({
        severity: "error",
        field: `computed.${name}`,
        message: `Base color ${entry.base} has invalid format`,
      });
    }

    // Validate transform
    if (!["darken", "lighten", "alpha"].includes(entry.transform)) {
      errors.push({
        severity: "error",
        field: `computed.${name}`,
        message: `Invalid transform "${entry.transform}". Use: darken, lighten, alpha`,
      });
    }

    // Validate amount
    if (entry.amount < 0 || entry.amount > 100) {
      errors.push({
        severity: "error",
        field: `computed.${name}`,
        message: `Amount must be 0-100, got ${entry.amount}`,
      });
    }
  });

  return errors;
}

function validateTokens(manifest: Manifest): ValidationMessage[] {
  const errors: ValidationMessage[] = [];

  if (!manifest.tokens) return errors;

  Object.entries(manifest.tokens).forEach(([scope, settings]) => {
    validateTokenProperties(scope, settings, "tokens", errors);
  });

  return errors;
}

function validateSemanticTokens(manifest: Manifest): ValidationMessage[] {
  const errors: ValidationMessage[] = [];

  if (!manifest.semanticTokens) return errors;

  Object.entries(manifest.semanticTokens).forEach(([scope, settings]) => {
    validateTokenProperties(scope, settings, "semanticTokens", errors);
  });

  return errors;
}

function validateLanguageTokens(manifest: Manifest): ValidationMessage[] {
  const errors: ValidationMessage[] = [];

  if (!manifest.languageTokens) return errors;

  Object.entries(manifest.languageTokens).forEach(([language, langTokens]) => {
    Object.entries(langTokens).forEach(([scope, settings]) => {
      validateTokenProperties(scope, settings, `languageTokens.${language}`, errors);
    });
  });

  return errors;
}

function validateTokenProperties(scope: string, settings: any, prefix: string, errors: ValidationMessage[]): void {
  Object.entries(settings).forEach(([prop, value]) => {
    const strVal = String(value);

    // Check foreground/background colors
    if ((prop === "foreground" || prop === "background") && !strVal.startsWith("$")) {
      const result = parseAndNormalizeColor(strVal);
      if (!result) {
        errors.push({
          severity: "error",
          field: `${prefix}.${scope}.${prop}`,
          message: `Invalid color format "${strVal}"`,
        });
      }
    }

    // Check fontStyle - can be single or space-separated multiple
    if (prop === "fontStyle" && strVal !== "") {
      const styles = strVal.split(/\s+/);
      const invalid = styles.filter((s) => !["bold", "italic", "underline"].includes(s));
      if (invalid.length > 0) {
        errors.push({
          severity: "error",
          field: `${prefix}.${scope}.${prop}`,
          message: `Invalid fontStyle "${strVal}". Use: bold, italic, underline (can combine)`,
        });
      }
    }

    // Check fontWeight
    if (prop === "fontWeight") {
      const weight = parseInt(strVal, 10);
      if (
        !["normal", "bold"].includes(strVal) &&
        (isNaN(weight) || weight < 100 || weight > 900 || weight % 100 !== 0)
      ) {
        errors.push({
          severity: "error",
          field: `${prefix}.${scope}.${prop}`,
          message: `Invalid fontWeight "${strVal}". Use: normal, bold, or 100-900`,
        });
      }
    }

    // Check opacity
    if (prop === "opacity") {
      const opacity = parseFloat(strVal);
      if (isNaN(opacity) || opacity < 0 || opacity > 1) {
        errors.push({
          severity: "error",
          field: `${prefix}.${scope}.${prop}`,
          message: `Opacity must be 0-1, got ${strVal}`,
        });
      }
    }
  });
}

function validatePresets(manifest: Manifest): ValidationMessage[] {
  const errors: ValidationMessage[] = [];

  if (!manifest.presets) return errors;

  Object.entries(manifest.presets).forEach(([presetName, preset]) => {
    // Validate variable overrides reference defined variables
    if (preset.variableOverrides) {
      Object.keys(preset.variableOverrides).forEach((varName) => {
        if (!manifest.variables?.[varName]) {
          errors.push({
            severity: "error",
            field: `presets.${presetName}`,
            message: `Preset references undefined variable $${varName}`,
            suggestion: `Define $${varName} in variables section`,
          });
        }
      });
    }
  });

  return errors;
}

async function validateExtends(extendsPath: string, manifestPath: string): Promise<ValidationMessage[]> {
  const errors: ValidationMessage[] = [];
  const resolvedExtends = path.resolve(path.dirname(manifestPath), extendsPath);

  try {
    await fs.stat(resolvedExtends);
  } catch {
    errors.push({
      severity: "error",
      field: "extends",
      message: `Extends file not found: ${extendsPath}`,
      suggestion: `Check the path relative to manifest location`,
    });
  }

  return errors;
}

function applyColorConversions(
  data: any,
  conversions: Array<{ line: number; field: string; from: string; to: string }>
): any {
  const result = JSON.parse(JSON.stringify(data));

  conversions.forEach((conv) => {
    const parts = conv.field.split(".");
    let obj = result;

    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }

    obj[parts[parts.length - 1]] = conv.to;
  });

  return result;
}

function getStats(manifest: Manifest | undefined): ValidationStats {
  return {
    variables: Object.keys(manifest?.variables || {}).length,
    colors: Object.keys(manifest?.colors || {}).length,
    tokens: Object.keys(manifest?.tokens || {}).length,
    semanticTokens: Object.keys(manifest?.semanticTokens || {}).length,
    languageTokens: Object.keys(manifest?.languageTokens || {}).length,
    presets: Object.keys(manifest?.presets || {}).length,
    extends: !!manifest?.extends,
    computed: Object.keys(manifest?.computed || {}).length,
    colorConversions: 0,
  };
}

function normalizeColorsInManifest(
  data: any,
  conversions: Array<{ line: number; field: string; from: string; to: string }>
): void {
  // Normalize variables
  if (data.variables) {
    Object.entries(data.variables).forEach(([key, value]: [string, any]) => {
      if (typeof value === "string" && !value.startsWith("$")) {
        const result = parseAndNormalizeColor(value);
        if (result && result.changes.length > 0) {
          conversions.push({
            line: 0,
            field: `variables.${key}`,
            from: value,
            to: result.hex,
          });
          data.variables[key] = result.hex;
        }
      }
    });
  }

  // Normalize colors
  if (data.colors) {
    Object.entries(data.colors).forEach(([key, value]: [string, any]) => {
      if (value !== null && typeof value === "string" && !value.startsWith("$")) {
        const result = parseAndNormalizeColor(value);
        if (result && result.changes.length > 0) {
          conversions.push({
            line: 0,
            field: `colors.${key}`,
            from: value,
            to: result.hex,
          });
          data.colors[key] = result.hex;
        }
      }
    });
  }

  // Normalize tokens
  if (data.tokens) {
    Object.entries(data.tokens).forEach(([scope, settings]: [string, any]) => {
      Object.entries(settings).forEach(([prop, value]: [string, any]) => {
        if (
          typeof value === "string" &&
          (prop === "foreground" || prop === "background") &&
          !value.startsWith("$")
        ) {
          const result = parseAndNormalizeColor(value);
          if (result && result.changes.length > 0) {
            conversions.push({
              line: 0,
              field: `tokens.${scope}.${prop}`,
              from: value,
              to: result.hex,
            });
            data.tokens[scope][prop] = result.hex;
          }
        }
      });
    });
  }

  // Normalize semanticTokens
  if (data.semanticTokens) {
    Object.entries(data.semanticTokens).forEach(([scope, settings]: [string, any]) => {
      Object.entries(settings).forEach(([prop, value]: [string, any]) => {
        if (
          typeof value === "string" &&
          (prop === "foreground" || prop === "background") &&
          !value.startsWith("$")
        ) {
          const result = parseAndNormalizeColor(value);
          if (result && result.changes.length > 0) {
            conversions.push({
              line: 0,
              field: `semanticTokens.${scope}.${prop}`,
              from: value,
              to: result.hex,
            });
            data.semanticTokens[scope][prop] = result.hex;
          }
        }
      });
    });
  }

  // Normalize languageTokens
  if (data.languageTokens) {
    Object.entries(data.languageTokens).forEach(([lang, langTokens]: [string, any]) => {
      Object.entries(langTokens).forEach(([scope, settings]: [string, any]) => {
        Object.entries(settings).forEach(([prop, value]: [string, any]) => {
          if (
            typeof value === "string" &&
            (prop === "foreground" || prop === "background") &&
            !value.startsWith("$")
          ) {
            const result = parseAndNormalizeColor(value);
            if (result && result.changes.length > 0) {
              conversions.push({
                line: 0,
                field: `languageTokens.${lang}.${scope}.${prop}`,
                from: value,
                to: result.hex,
              });
              data.languageTokens[lang][scope][prop] = result.hex;
            }
          }
        });
      });
    });
  }

  // Normalize presets
  if (data.presets) {
    Object.entries(data.presets).forEach(([presetName, preset]: [string, any]) => {
      if (preset.variableOverrides) {
        Object.entries(preset.variableOverrides).forEach(([varName, value]: [string, any]) => {
          if (typeof value === "string" && !value.startsWith("$")) {
            const result = parseAndNormalizeColor(value);
            if (result && result.changes.length > 0) {
              conversions.push({
                line: 0,
                field: `presets.${presetName}.variableOverrides.${varName}`,
                from: value,
                to: result.hex,
              });
              data.presets[presetName].variableOverrides[varName] = result.hex;
            }
          }
        });
      }
    });
  }
}

function validateExporters(manifest: Manifest): ValidationMessage[] {
  const errors: ValidationMessage[] = [];

  try {
    exportVSCode(manifest);
  } catch (error) {
    errors.push({
      severity: "error",
      field: "exporters.vscode",
      message: `VS Code export failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  try {
    exportZed(manifest);
  } catch (error) {
    errors.push({
      severity: "error",
      field: "exporters.zed",
      message: `Zed export failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  try {
    exportNotepadPlus(manifest);
  } catch (error) {
    errors.push({
      severity: "error",
      field: "exporters.notepad++",
      message: `Notepad++ export failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return errors;
}

function printValidationResult(
  errors: ValidationMessage[],
  warnings: ValidationMessage[],
  manifest: Manifest | undefined,
  conversions: Array<{ line: number; field: string; from: string; to: string }>,
  isFixing?: boolean
): void {
  if (errors.length === 0 && warnings.length === 0) {
    const stats = getStats(manifest);
    logger.success("manifest.json valid");
    console.log(`  • ${stats.variables} variables, ${stats.colors} colors, ${stats.tokens} tokens`);
    if (stats.presets > 0) console.log(`  • ${stats.presets} presets`);
    if (stats.computed > 0) console.log(`  • ${stats.computed} computed colors`);
    if (conversions.length > 0) {
      console.log(`  • All colors converted: ${conversions.map((c) => `${c.from} → ${c.to}`).join(", ")}`);
    }
    console.log(`  • No issues`);
  } else {
    const errorCount = errors.length;
    const warningCount = warnings.length;
    logger.error(`manifest.json invalid (${errorCount} error${errorCount !== 1 ? "s" : ""}, ${warningCount} warning${warningCount !== 1 ? "s" : ""})`);

    console.log("");

    errors.forEach((err) => {
      console.log(`  ERROR [${err.field}]: ${err.message}`);
      if (err.suggestion) {
        console.log(`    ${err.suggestion}`);
      }
    });

    if (warningCount > 0) {
      console.log("");
    }

    warnings.forEach((warn) => {
      console.log(`  WARNING [${warn.field}]: ${warn.message}`);
      if (warn.suggestion) {
        console.log(`    ${warn.suggestion}`);
      }
    });
  }
}

import { Manifest } from "./manifest";

export interface VariableResolutionError {
  variable: string;
  reason: "undefined" | "circular";
  chain?: string[];
  message: string;
}

export type ResolutionResult =
  | {
      success: true;
      variables: Record<string, string>;
    }
  | {
      success: false;
      error: VariableResolutionError;
    };

/**
 * Resolves all variable references in manifest.
 * Detects circular dependencies and undefined variables.
 */
export function resolveVariables(manifest: Manifest): ResolutionResult {
  const resolvedVariables: Record<string, string> = {};
  const visiting = new Set<string>();
  const resolved = new Set<string>();

  for (const [name, value] of Object.entries(manifest.variables || {})) {
    const result = resolveVariable(name, value, manifest.variables || {}, visiting, resolved, resolvedVariables);
    if (!result.success) {
      return result;
    }
  }

  return { success: true, variables: resolvedVariables };
}

function resolveVariable(
  name: string,
  value: string,
  allVariables: Record<string, string>,
  visiting: Set<string>,
  resolved: Set<string>,
  resolvedVariables: Record<string, string>
): ResolutionResult {
  if (resolved.has(name)) {
    return { success: true, variables: resolvedVariables };
  }

  if (visiting.has(name)) {
    const chain = Array.from(visiting);
    chain.push(name);
    return {
      success: false,
      error: {
        variable: name,
        reason: "circular",
        chain,
        message: `Circular variable reference: ${chain.join(" → ")}`,
      },
    };
  }

  visiting.add(name);

  // Check if the value contains a variable reference
  const varRefMatch = value.match(/\$(\w+)/);
  if (varRefMatch) {
    const refVarName = varRefMatch[1];
    if (!(refVarName in allVariables)) {
      return {
        success: false,
        error: {
          variable: name,
          reason: "undefined",
          message: `Undefined variable reference: $${refVarName} in variable "${name}"`,
        },
      };
    }

    const refValue = allVariables[refVarName];
    const refResult = resolveVariable(refVarName, refValue, allVariables, visiting, resolved, resolvedVariables);
    if (!refResult.success) {
      return refResult;
    }

    visiting.delete(name);
    resolved.add(name);
    resolvedVariables[name] = resolvedVariables[refVarName];
    return { success: true, variables: resolvedVariables };
  }

  visiting.delete(name);
  resolved.add(name);
  resolvedVariables[name] = value;
  return { success: true, variables: resolvedVariables };
}

/**
 * Replaces all $variableName references in colors and tokens with resolved values.
 */
export function interpolateManifest(
  manifest: Manifest,
  resolvedVariables: Record<string, string>
): Manifest {
  return {
    ...manifest,
    colors: interpolateObject(manifest.colors || {}, resolvedVariables),
    tokens: interpolateTokens(manifest.tokens || {}, resolvedVariables),
  };
}

function interpolateObject(
  obj: Record<string, string>,
  variables: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = interpolateString(value, variables);
  }
  return result;
}

function interpolateTokens(
  tokens: Record<string, Record<string, any>>,
  variables: Record<string, string>
): Record<string, Record<string, any>> {
  const result: Record<string, Record<string, any>> = {};
  for (const [scope, settings] of Object.entries(tokens)) {
    result[scope] = {};
    for (const [prop, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        result[scope][prop] = interpolateString(value, variables);
      } else {
        result[scope][prop] = value;
      }
    }
  }
  return result;
}

function interpolateString(value: string, variables: Record<string, string>): string {
  return value.replace(/\$(\w+)/g, (match, varName) => {
    return variables[varName] || match;
  });
}

/**
 * Validates that all $variableName references point to existing variables.
 */
export function validateVariableReferences(manifest: Manifest): ValidationError[] {
  const errors: ValidationError[] = [];
  const undefinedVars = new Set<string>();

  // Check colors
  for (const [key, value] of Object.entries(manifest.colors || {})) {
    const refs = extractVariableReferences(value);
    for (const ref of refs) {
      if (!(ref in (manifest.variables || {}))) {
        undefinedVars.add(ref);
        errors.push({
          location: `colors.${key}`,
          variable: ref,
          message: `Undefined variable $${ref}`,
        });
      }
    }
  }

  // Check tokens
  for (const [scope, settings] of Object.entries(manifest.tokens || {})) {
    for (const [prop, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        const refs = extractVariableReferences(value);
        for (const ref of refs) {
          if (!(ref in (manifest.variables || {}))) {
            undefinedVars.add(ref);
            errors.push({
              location: `tokens.${scope}.${prop}`,
              variable: ref,
              message: `Undefined variable $${ref}`,
            });
          }
        }
      }
    }
  }

  return errors;
}

function extractVariableReferences(value: string): string[] {
  const refs: string[] = [];
  const regex = /\$(\w+)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

export interface ValidationError {
  location: string;
  variable: string;
  message: string;
}

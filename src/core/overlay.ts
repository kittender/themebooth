import { z } from "zod";
import { Manifest } from "./manifest";
import {
  hexColorSchema,
  colorOrVariableSchema,
  tokenSettingsSchema,
  interpolateString,
} from "./schemas";
import fs from "fs";
import path from "path";

export interface EditorOverlay {
  inherits: string;
  colors?: Record<string, string | null>;
  tokenOverrides?: Record<string, Record<string, unknown>>;
  languageTokens?: Record<string, Record<string, Record<string, unknown>>>;
  less?: Record<string, Record<string, string>>;
  decorativeElements?: Record<string, string>;
  visualEffects?: Record<string, unknown>;
}

export const EditorOverlaySchema = z.object({
  inherits: z.string(),
  colors: z.record(z.union([z.string(), z.null()])).optional().default({}),
  tokenOverrides: z.record(z.record(z.union([hexColorSchema, z.string(), z.number()]))).optional().default({}),
  languageTokens: z.record(z.record(z.record(z.union([hexColorSchema, z.string(), z.number()])))).optional().default({}),
  less: z.record(z.record(z.string())).optional().default({}),
  decorativeElements: z.record(z.string()).optional().default({}),
  visualEffects: z.record(z.unknown()).optional().default({}),
});

export type ValidatedOverlay = z.infer<typeof EditorOverlaySchema>;

export function loadOverlay(overlayPath: string): EditorOverlay | null {
  try {
    if (!fs.existsSync(overlayPath)) {
      return null;
    }
    const content = fs.readFileSync(overlayPath, "utf-8");
    const data = JSON.parse(content);
    const validated = EditorOverlaySchema.parse(data);
    return validated;
  } catch (error) {
    throw new Error(`Failed to load overlay from ${overlayPath}: ${String(error)}`);
  }
}

export function resolveOverlayVariables(
  overlay: EditorOverlay,
  resolvedVariables: Record<string, string>
): EditorOverlay {
  return {
    ...overlay,
    colors: interpolateColors(overlay.colors || {}, resolvedVariables),
    less: interpolateLess(overlay.less || {}, resolvedVariables),
  };
}

function interpolateColors(
  colors: Record<string, string | null>,
  variables: Record<string, string>
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(colors)) {
    if (value === null) {
      result[key] = null;
    } else {
      result[key] = interpolateString(value, variables);
    }
  }
  return result;
}

function interpolateLess(
  less: Record<string, Record<string, string>>,
  variables: Record<string, string>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [selector, props] of Object.entries(less)) {
    result[selector] = {};
    for (const [prop, value] of Object.entries(props)) {
      result[selector][prop] = interpolateString(value, variables);
    }
  }
  return result;
}

export function mergeOverlayIntoManifest(manifest: Manifest, overlay: EditorOverlay): Manifest {
  const merged: Manifest = { ...manifest };

  merged.colors = { ...manifest.colors, ...overlay.colors };

  if (overlay.tokenOverrides) {
    const mergedTokens: Record<string, Record<string, unknown>> = { ...manifest.tokens };
    for (const [scope, overrides] of Object.entries(overlay.tokenOverrides)) {
      const existingToken = manifest.tokens?.[scope] || {};
      mergedTokens[scope] = { ...existingToken, ...overrides };
    }
    merged.tokens = mergedTokens as typeof merged.tokens;
  }

  return merged;
}

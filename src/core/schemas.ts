import { z } from "zod";

// Shared regex patterns
export const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/;
export const colorOrVariableRegex = /^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})|\$[\w-]+)$/;
export const variableRefRegex = /\$([\w-]+)/g;

// Valid token properties
export const validTokenProperties = ["foreground", "background", "fontStyle", "fontWeight", "opacity"] as const;

// Token scope to CodeMirror class mapping
export const tokenToCodeMirrorClass: Record<string, string> = {
  comment: "cm-comment",
  keyword: "cm-keyword",
  string: "cm-string",
  number: "cm-number",
  constant: "cm-atom",
  variable: "cm-variable",
  tag: "cm-tag",
  attribute: "cm-attribute",
  operator: "cm-operator",
  punctuation: "cm-punctuation",
  entity: "cm-def",
  invalid: "cm-error",
};

// Shared schemas
export const hexColorSchema = z
  .string()
  .regex(hexColorRegex, "Invalid hex color format. Use #RRGGBB, #RGB, #RRGGBBAA, or #RGBA");

export const colorOrVariableSchema = z
  .string()
  .regex(colorOrVariableRegex, "Invalid color format. Use #RRGGBB, #RGB, or $variableName");

export const tokenSettingsSchema = z
  .record(z.union([hexColorSchema, z.string(), z.number()]))
  .refine(
    (settings) => {
      return Object.keys(settings).every((key) => validTokenProperties.includes(key as any));
    },
    (settings) => ({
      message: `Invalid token properties. Valid properties: ${validTokenProperties.join(", ")}. Got: ${Object.keys(settings).join(", ")}`,
    })
  );

// Shared types
export interface ValidationError {
  location?: string;
  field?: string;
  variable?: string;
  message: string;
  line?: number;
}

// Utility functions
export function interpolateString(value: string, variables: Record<string, string>): string {
  return value.replace(variableRefRegex, (match, varName) => {
    return variables[varName] || match;
  });
}

export function extractVariableReferences(value: string): string[] {
  const refs: string[] = [];
  const regex = /\$([\w-]+)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

export function extractTokenSettings(settings: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  if (settings.foreground !== undefined) result.foreground = settings.foreground;
  if (settings.background !== undefined) result.background = settings.background;
  if (settings.fontStyle !== undefined) result.fontStyle = settings.fontStyle;
  if (settings.fontWeight !== undefined) result.fontWeight = settings.fontWeight;
  if (settings.opacity !== undefined) result.opacity = settings.opacity;

  return result;
}

export function filterNullColors(colors: Record<string, string | null>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

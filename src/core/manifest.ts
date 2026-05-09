import { z } from "zod";
import {
  hexColorRegex,
  colorOrVariableRegex,
  hexColorSchema,
  colorOrVariableSchema,
  tokenSettingsSchema,
  ValidationError,
} from "./schemas";

export type { ValidationError };

export const presetSchema = z.object({
  description: z.string().optional(),
  variableOverrides: z.record(colorOrVariableSchema).optional(),
  tokenOverrides: z.record(tokenSettingsSchema).optional(),
  softwareOverrides: z.record(z.record(z.string())).optional(),
});

export type Preset = z.infer<typeof presetSchema>;

export const computedEntrySchema = z.object({
  base: z.string().regex(colorOrVariableRegex, "base must be a hex color or $variable"),
  transform: z.enum(["darken", "lighten", "alpha"]),
  amount: z.number().min(0).max(100),
});

export type ComputedEntry = z.infer<typeof computedEntrySchema>;

export const ManifestSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  description: z.string().optional().default(""),
  author: z.string().min(1, "Author is required"),
  version: z.string().regex(/^\d+\.\d+\.\d+/, "Version must follow semver (e.g., 1.0.0)"),

  variables: z.record(colorOrVariableSchema).optional().default({}),

  colors: z
    .record(z.union([z.string(), z.null()]))
    .optional()
    .default({})
    .superRefine((colors, ctx) => {
      Object.entries(colors).forEach(([key, value]) => {
        if (value === null) return;

        if (typeof value !== "string") {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: "string",
            received: typeof value,
            path: [key],
            message: "Color value must be a string",
          });
          return;
        }

        if (!value.startsWith("$") && !hexColorRegex.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `Invalid color value "${value}". Use #RRGGBB, #RGB, or $variableName`,
          });
        }
      });
    }),

  tokens: z
    .record(tokenSettingsSchema)
    .optional()
    .default({})
    .superRefine((tokens, ctx) => {
      Object.entries(tokens).forEach(([scope, settings]) => {
        Object.entries(settings as Record<string, unknown>).forEach(([prop, value]) => {
          if (
            prop === "foreground" ||
            prop === "background"
          ) {
            const strVal = String(value);
            if (!strVal.startsWith("$") && !hexColorRegex.test(strVal)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [scope, prop],
                message: `Invalid color value "${value}" for ${prop}`,
              });
            }
          }
        });
      });
    }),

  semanticTokens: z.record(tokenSettingsSchema).optional().default({}),

  languageTokens: z.record(z.record(tokenSettingsSchema)).optional().default({}),

  presets: z.record(presetSchema).optional().default({}),

  extends: z.string().optional(),

  computed: z.record(computedEntrySchema).optional().default({}),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export function validateManifest(data: unknown): { success: true; data: Manifest } | { success: false; errors: ValidationError[] } {
  try {
    const result = ManifestSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((issue) => ({
        field: issue.path.join(".") || "root",
        message: issue.message,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: "unknown", message: String(error) }],
    };
  }
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((err) => `  • ${err.field}: ${err.message}`)
    .join("\n");
}

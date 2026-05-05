import { z } from "zod";

const HexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const hexColorSchema = z
  .string()
  .regex(HexColorRegex, "Invalid hex color format. Use #RRGGBB or #RGB");

const validTokenProperties = ["foreground", "background", "fontStyle", "fontWeight", "opacity"] as const;

const tokenSettingsSchema = z
  .record(z.union([hexColorSchema, z.string(), z.number()]))
  .refine(
    (settings) => {
      return Object.keys(settings).every((key) => validTokenProperties.includes(key as any));
    },
    (settings) => ({
      message: `Invalid token properties. Valid properties: ${validTokenProperties.join(", ")}. Got: ${Object.keys(settings).join(", ")}`,
    })
  );

export const ManifestSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  description: z.string().optional().default(""),
  author: z.string().min(1, "Author is required"),
  version: z.string().regex(/^\d+\.\d+\.\d+/, "Version must follow semver (e.g., 1.0.0)"),

  variables: z.record(hexColorSchema).optional().default({}),

  colors: z
    .record(z.string())
    .optional()
    .default({})
    .superRefine((colors, ctx) => {
      Object.entries(colors).forEach(([key, value]) => {
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

        if (!value.startsWith("$") && !HexColorRegex.test(value)) {
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
            if (!strVal.startsWith("$") && !HexColorRegex.test(strVal)) {
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

  presets: z.array(z.enum(["dark", "light", "high-contrast"])).optional().default([]),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export interface ValidationError {
  field: string;
  message: string;
  line?: number;
}

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

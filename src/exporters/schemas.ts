import { z } from "zod";
import { hexColorSchema, tokenSettingsSchema } from "../core/schemas";

// Sublime Theme Schema
export const SublimeThemeSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  author: z.string(),
  variables: z.record(z.string()).optional().default({}),
  globals: z.record(z.union([z.string(), z.number()])).optional().default({}),
  rules: z.array(
    z.object({
      name: z.string().optional(),
      scope: z.string().min(1),
      foreground: z.string().optional(),
      background: z.string().optional(),
      fontStyle: z.string().optional(),
    })
  ),
});

// Vim Color Scheme Schema
export const VimColorSchemeSchema = z.object({
  name: z.string().min(1),
  background: z.string(),
  foreground: z.string(),
  highlights: z.record(
    z.object({
      ctermbg: z.string().optional(),
      ctermfg: z.string().optional(),
      guibg: z.string().optional(),
      guifg: z.string().optional(),
      cterm: z.string().optional(),
      gui: z.string().optional(),
    })
  ),
});

// Atom Theme Schema
export const AtomThemeSchema = z.object({
  name: z.string().min(1),
  author: z.string(),
  version: z.string(),
  description: z.string(),
  colors: z.record(hexColorSchema).optional().default({}),
  tokenColors: z.array(
    z.object({
      scope: z.union([z.string(), z.array(z.string())]),
      settings: z.record(z.union([hexColorSchema, z.string(), z.number()])),
    })
  ),
});

// Editor-specific overlay validation schemas
export const SublimeOverlaySchema = z.object({
  inherits: z.string(),
  globals: z.record(z.union([z.string(), z.number()])).optional(),
  scope_overrides: z.record(z.record(z.string())).optional(),
  tokenOverrides: z.record(z.record(z.union([hexColorSchema, z.string()]))).optional(),
});

export const VimOverlaySchema = z.object({
  inherits: z.string(),
  highlights: z.record(
    z.object({
      guifg: z.string().optional(),
      guibg: z.string().optional(),
      gui: z.string().optional(),
      ctermfg: z.string().optional(),
      ctermbg: z.string().optional(),
      cterm: z.string().optional(),
    })
  ).optional(),
});

export const AtomOverlaySchema = z.object({
  inherits: z.string(),
  colors: z.record(hexColorSchema).optional(),
  tokenOverrides: z.record(z.record(z.union([hexColorSchema, z.string()]))).optional(),
});

// Export type inferences
export type SublimeTheme = z.infer<typeof SublimeThemeSchema>;
export type VimColorScheme = z.infer<typeof VimColorSchemeSchema>;
export type AtomTheme = z.infer<typeof AtomThemeSchema>;
export type SublimeOverlay = z.infer<typeof SublimeOverlaySchema>;
export type VimOverlay = z.infer<typeof VimOverlaySchema>;
export type AtomOverlay = z.infer<typeof AtomOverlaySchema>;

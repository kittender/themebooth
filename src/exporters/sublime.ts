import { Manifest } from "../core/manifest";
import { EditorOverlay } from "../core/overlay";
import { filterNullColors } from "../core/schemas";
import { mergeTokenOverrides } from "./utils";

export interface SublimeTheme {
  name: string;
  author: string;
  variables: Record<string, string>;
  globals: Record<string, string | number>;
  rules: Array<{
    name?: string;
    scope: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
}

export interface SublimeColorScheme {
  name: string;
  author: string;
  variables?: Record<string, string>;
  globals: Record<string, string | number>;
  rules: Array<{
    name?: string;
    scope: string;
    foreground?: string;
    background?: string;
    font_style?: string;
  }>;
}

export interface SublimeUITheme {
  variables?: Record<string, string>;
  globals?: Record<string, any>;
  rules?: Array<Record<string, any>>;
}

export interface SublimeExportPackage {
  colorScheme: SublimeColorScheme;
  uiTheme?: SublimeUITheme;
  metadata: SublimeMetadata;
}

export interface SublimeMetadata {
  name: string;
  author: string;
  version: string;
  description?: string;
  url?: string;
  license?: string;
}

export function exportSublime(manifest: Manifest, overlay: EditorOverlay): SublimeTheme {
  const merged = mergeTokenOverrides(manifest, overlay);

  const rules: SublimeTheme["rules"] = merged.map((rule) => ({
    scope: rule.scope,
    foreground: rule.settings.foreground,
    background: rule.settings.background,
    fontStyle: rule.settings.fontStyle,
  }));

  return {
    name: manifest.name,
    author: manifest.author,
    variables: manifest.variables || {},
    globals: buildGlobals(manifest.colors || {}, overlay.colors || {}),
    rules,
  };
}

export function exportSublimeMultiFile(manifest: Manifest, overlay: EditorOverlay): SublimeExportPackage {
  const merged = mergeTokenOverrides(manifest, overlay);
  const mergedColors = { ...manifest.colors, ...overlay.colors };

  const rules = merged.map((rule) => ({
    name: rule.scope,
    scope: rule.scope,
    foreground: rule.settings.foreground,
    background: rule.settings.background,
    font_style: rule.settings.fontStyle,
  })).filter((rule) => rule.foreground || rule.background || rule.font_style);

  const colorScheme: SublimeColorScheme = {
    name: manifest.name,
    author: manifest.author,
    variables: manifest.variables || {},
    globals: buildGlobals(manifest.colors || {}, overlay.colors || {}),
    rules,
  };

  const uiTheme: SublimeUITheme = buildUITheme(mergedColors);

  const metadata: SublimeMetadata = {
    name: manifest.name,
    author: manifest.author,
    version: manifest.version,
    description: manifest.description,
    license: "MIT",
  };

  return {
    colorScheme,
    uiTheme,
    metadata,
  };
}

function buildGlobals(
  manifestColors: Record<string, string | null>,
  overlayColors: Record<string, string | null>
): Record<string, string | number> {
  const merged = { ...manifestColors, ...overlayColors };
  const globals: Record<string, string | number> = {};

  // Map common color keys to Sublime globals
  const colorMap: Record<string, string> = {
    "editor.background": "background",
    "editor.foreground": "foreground",
    "editor.lineHighlightBackground": "line_highlight",
    "editor.selectionBackground": "selection",
    "editor.cursorColor": "caret",
    "editorGutter.background": "gutter_background",
    "editorLineNumber.foreground": "line_number_foreground",
    "editorCursor.foreground": "caret",
    "editorWhitespace.foreground": "invisibles",
  };

  for (const [key, mappedKey] of Object.entries(colorMap)) {
    const value = merged[key];
    if (value) globals[mappedKey] = value;
  }

  return globals;
}

function buildUITheme(colors: Record<string, string | null>): SublimeUITheme {
  const filtered = filterNullColors(colors);

  return {
    variables: {},
    globals: {
      "background": filtered["editor.background"] || "#1e1e1e",
      "foreground": filtered["editor.foreground"] || "#d4d4d4",
      "line_highlight": filtered["editor.lineHighlightBackground"] + "20" || "#ffffff10",
      "selection": filtered["editor.selectionBackground"] || "#264f78",
      "caret": filtered["editor.cursorColor"] || "#aeafad",
      "gutter_background": filtered["editorGutter.background"],
      "gutter_foreground": filtered["editorLineNumber.foreground"],
    },
  };
}

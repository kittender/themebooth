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
  };

  for (const [key, mappedKey] of Object.entries(colorMap)) {
    const value = merged[key];
    if (value) globals[mappedKey] = value;
  }

  return globals;
}

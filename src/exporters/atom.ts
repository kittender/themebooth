import { Manifest } from "../core/manifest";
import { EditorOverlay } from "../core/overlay";
import { filterNullColors } from "../core/schemas";
import { mergeTokenOverrides } from "./utils";

export interface AtomTheme {
  name: string;
  author: string;
  version: string;
  description: string;
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string | string[];
    settings: Record<string, any>;
  }>;
}

export function exportAtom(manifest: Manifest, overlay: EditorOverlay): AtomTheme {
  const merged = mergeTokenOverrides(manifest, overlay);

  return {
    name: manifest.name,
    author: manifest.author,
    version: manifest.version,
    description: manifest.description || "",
    colors: buildAtomColors(manifest.colors || {}, overlay.colors || {}),
    tokenColors: merged,
  };
}

function buildAtomColors(
  manifestColors: Record<string, string | null>,
  overlayColors: Record<string, string | null>
): Record<string, string> {
  const merged = { ...manifestColors, ...overlayColors };
  const filtered = filterNullColors(merged);

  // Map editor colors to Atom-specific keys
  const atomColors: Record<string, string> = {};

  const colorMap: Record<string, string> = {
    "editor.background": "editor.backgroundColor",
    "editor.foreground": "editor.textColor",
    "editor.cursorColor": "editor.cursorColor",
    "editor.lineHighlightBackground": "editor.lineHighlightBackgroundColor",
    "editor.selectionBackground": "editor.selectionBackgroundColor",
    "editorCursor.foreground": "editor.cursorColor",
    "editorLineNumber.foreground": "editor.gutterTextColor",
    "editorGutter.background": "editor.gutterBackgroundColor",
  };

  for (const [key, atomKey] of Object.entries(colorMap)) {
    const value = filtered[key];
    if (value) atomColors[atomKey] = value;
  }

  // Add any remaining colors not in the map
  for (const [key, value] of Object.entries(filtered)) {
    if (!colorMap[key]) {
      atomColors[key] = value;
    }
  }

  return atomColors;
}

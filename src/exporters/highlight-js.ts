import { Manifest } from "../core/manifest";
import { extractTokenSettings, filterNullColors } from "../core/schemas";

export interface HighlightJsTheme {
  [key: string]: string;
}

function mapScopeToHighlightJs(scope: string): string[] {
  const scopeLower = scope.toLowerCase();
  const classes: Set<string> = new Set();

  // Map TextMate scopes to Highlight.js class names
  const scopeMappings: Record<string, string[]> = {
    "string": ["hljs-string"],
    "comment": ["hljs-comment"],
    "number": ["hljs-number"],
    "constant.numeric": ["hljs-number"],
    "keyword": ["hljs-keyword"],
    "keyword.operator": ["hljs-operator"],
    "variable": ["hljs-variable"],
    "variable.builtin": ["hljs-built_in"],
    "variable.other": ["hljs-variable"],
    "entity.name.function": ["hljs-title", "hljs-function"],
    "entity.name.class": ["hljs-title", "hljs-class"],
    "entity.name.tag": ["hljs-tag"],
    "entity.other.attribute-name": ["hljs-attr"],
    "support.function": ["hljs-built_in"],
    "support.class": ["hljs-title"],
    "support.type": ["hljs-type"],
    "markup.bold": ["hljs-strong"],
    "markup.italic": ["hljs-emphasis"],
    "markup.deleted": ["hljs-deletion"],
    "markup.inserted": ["hljs-addition"],
    "markup.quote": ["hljs-quote"],
    "punctuation": ["hljs-punctuation"],
    "punctuation.definition.string": ["hljs-string"],
    "meta.tag": ["hljs-tag"],
    "meta.function": ["hljs-function"],
    "meta.selector": ["hljs-selector"],
    "storage.type": ["hljs-type"],
    "storage.modifier": ["hljs-keyword"],
  };

  // Direct matches and prefix matches
  for (const [pattern, highlightClasses] of Object.entries(scopeMappings)) {
    if (scopeLower === pattern || scopeLower.startsWith(pattern + ".")) {
      highlightClasses.forEach((cls) => classes.add(cls));
    }
  }

  // Fallback: extract category from scope
  if (classes.size === 0) {
    const firstPart = scopeLower.split(".")[0];
    const categoryMap: Record<string, string> = {
      string: "hljs-string",
      comment: "hljs-comment",
      keyword: "hljs-keyword",
      variable: "hljs-variable",
      entity: "hljs-title",
      support: "hljs-built_in",
      storage: "hljs-type",
      constant: "hljs-literal",
      markup: "hljs-section",
      meta: "hljs-meta",
      punctuation: "hljs-punctuation",
    };

    if (categoryMap[firstPart]) {
      classes.add(categoryMap[firstPart]);
    }
  }

  // Default if no match found
  if (classes.size === 0) {
    classes.add("hljs-attr");
  }

  return Array.from(classes);
}

export function exportHighlightJs(manifest: Manifest): HighlightJsTheme {
  const theme: HighlightJsTheme = {};

  // Add base colors
  const baseColor = manifest.colors?.["editor.foreground"] || "#000000";
  const bgColor = manifest.colors?.["editor.background"] || "#ffffff";

  theme["hljs"] = baseColor;
  theme["hljs-background"] = bgColor;

  // Map editor colors to Highlight.js
  if (manifest.colors) {
    if (manifest.colors["editor.background"]) {
      theme["hljs-background"] = manifest.colors["editor.background"];
    }
    if (manifest.colors["editorLineNumber.foreground"]) {
      theme["hljs-number"] = manifest.colors["editorLineNumber.foreground"];
    }
  }

  // Process tokens
  const tokenColorMap = new Map<string, string>();

  for (const [scope, settings] of Object.entries(manifest.tokens || {})) {
    const extracted = extractTokenSettings(settings);
    if (extracted.foreground) {
      const highlightClasses = mapScopeToHighlightJs(scope);
      highlightClasses.forEach((cls) => {
        // Don't override if already set (prioritize more specific scopes)
        if (!tokenColorMap.has(cls)) {
          tokenColorMap.set(cls, extracted.foreground);
        }
      });
    }
  }

  // Apply token colors to theme
  tokenColorMap.forEach((color, className) => {
    theme[className] = color;
  });

  return theme;
}

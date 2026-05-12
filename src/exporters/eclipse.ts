import { Manifest } from "../core/manifest";
import { EditorOverlay } from "../core/overlay";
import { mergeTokenOverrides, TokenRule } from "./utils";
import { hexToRgb } from "../core/colors";

export interface EclipseColorEntry {
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface EclipseColorTheme {
  name: string;
  version: string;
  author: string;
  id: string;
  colorEntries: Record<string, EclipseColorEntry>;
  uiColors: Record<string, string>;
}

export interface EclipseExportPackage {
  colorThemeXml: string;
  pluginXml: string;
  manifestMf: string;
  pluginProperties: string;
  epfContent: string;
}

const SCOPE_TO_ECLIPSE_ELEMENT: Record<string, string> = {
  keyword: "keyword",
  string: "string",
  "string.literal": "string",
  "string.template": "string",
  comment: "singleLineComment",
  "comment.line": "singleLineComment",
  "comment.block": "multiLineComment",
  number: "number",
  "number.integer": "number",
  "number.float": "number",
  function: "method",
  "function.call": "methodCall",
  "function.declaration": "method",
  variable: "localVariable",
  "variable.parameter": "parameterVariable",
  "variable.field": "field",
  type: "class",
  "type.class": "class",
  "type.interface": "interface",
  "type.enum": "class",
  annotation: "annotation",
  constant: "staticField",
  "constant.numeric": "number",
  operator: "operator",
  punctuation: "operator",
};

const SCOPE_TO_EPF_KEY: Record<string, string[]> = {
  keyword: ["syntaxColor.java_keyword"],
  string: ["syntaxColor.java_string"],
  "string.literal": ["syntaxColor.java_string"],
  comment: [
    "syntaxColor.java_single_line_comment",
    "syntaxColor.java_multi_line_comment",
  ],
  "comment.line": ["syntaxColor.java_single_line_comment"],
  "comment.block": ["syntaxColor.java_multi_line_comment"],
  number: ["syntaxColor.java_integer_literal", "syntaxColor.java_long_literal"],
  function: ["syntaxColor.java_method_declaration"],
  "function.call": ["syntaxColor.java_method_call"],
  variable: ["syntaxColor.java_local_variable_declaration"],
  "variable.parameter": ["syntaxColor.java_parameter_variable"],
  type: ["syntaxColor.java_class_interface_enum"],
  "type.class": ["syntaxColor.java_class"],
  "type.interface": ["syntaxColor.java_interface"],
  annotation: ["syntaxColor.java_annotation"],
  constant: ["syntaxColor.java_static_final_field"],
  operator: ["syntaxColor.java_operator"],
};

const UI_COLOR_MAPPING: Record<string, string> = {
  "editor.background": "background",
  "editor.foreground": "foreground",
  "editorLineNumber.foreground": "lineNumber",
  "editorLineNumber.background": "lineNumberBackground",
  "editor.selectionBackground": "selection",
  "editor.lineHighlightBackground": "currentLine",
  "editor.findMatchHighlightBackground": "occurrenceIndication",
  "editor.rangeHighlightBackground": "searchResultIndication",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `${rgb.r},${rgb.g},${rgb.b}`;
}

function generateColorThemeId(themeName: string): string {
  return `com.themebooth.${themeName.toLowerCase().replace(/\s+/g, "-")}`;
}

function buildEclipseColorTheme(
  manifest: Manifest,
  overlay: EditorOverlay | null
): EclipseColorTheme {
  const mergedTokens = mergeTokenOverrides(manifest, overlay || null);
  const colorEntries: Record<string, EclipseColorEntry> = {};

  for (const rule of mergedTokens) {
    const eclipseElement =
      SCOPE_TO_ECLIPSE_ELEMENT[rule.scope] ||
      rule.scope.replace(/\./g, "").toLowerCase();

    const bold = rule.settings.fontStyle?.includes("bold") ?? false;
    const italic = rule.settings.fontStyle?.includes("italic") ?? false;
    const underline = rule.settings.fontStyle?.includes("underline") ?? false;

    const color = rule.settings.foreground || "#000000";

    colorEntries[eclipseElement] = {
      color,
      ...(bold && { bold }),
      ...(italic && { italic }),
      ...(underline && { underline }),
    };
  }

  const uiColors: Record<string, string> = {};
  for (const [manifestKey, eclipseKey] of Object.entries(UI_COLOR_MAPPING)) {
    const color = manifest.colors?.[manifestKey];
    if (color && color !== null) {
      uiColors[eclipseKey] = color;
    }
  }

  return {
    name: manifest.name,
    version: manifest.version,
    author: manifest.author || "ThemeBooth",
    id: generateColorThemeId(manifest.name),
    colorEntries,
    uiColors,
  };
}

function serializeEclipseXml(theme: EclipseColorTheme): string {
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<colorTheme id="${escapeXml(theme.id)}" name="${escapeXml(theme.name)}" modified="${new Date().toISOString()}" author="${escapeXml(theme.author)}" version="${escapeXml(theme.version)}">
`;

  // UI colors
  for (const [key, color] of Object.entries(theme.uiColors)) {
    xml += `  <${key} color="${color}"/>\n`;
  }

  // Color entries
  for (const [element, entry] of Object.entries(theme.colorEntries)) {
    const attrs = [
      `color="${entry.color}"`,
      ...(entry.bold ? ["bold=\"true\""] : []),
      ...(entry.italic ? ["italic=\"true\""] : []),
      ...(entry.underline ? ["underline=\"true\""] : []),
    ];
    xml += `  <${element} ${attrs.join(" ")}/>\n`;
  }

  xml += `</colorTheme>\n`;
  return xml;
}

function generateEclipsePluginXml(
  themeName: string,
  colorFileName: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?eclipse version="3.4"?>
<plugin>
  <extension point="org.eclipse.colorTheme.theme">
    <theme name="${escapeXml(themeName)}" file="colors/${escapeXml(colorFileName)}"/>
  </extension>
</plugin>
`;
}

function generateManifestMf(
  themeName: string,
  version: string,
  author: string
): string {
  const symbolicName = `com.themebooth.${themeName
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
  return `Manifest-Version: 1.0
Bundle-ManifestVersion: 2
Bundle-Name: ${escapeXml(themeName)} Theme
Bundle-SymbolicName: ${symbolicName};singleton:=true
Bundle-Version: ${version}
Bundle-Vendor: ${escapeXml(author)}
Require-Bundle: org.eclipse.ui;bundle-version="3.100.0"
Bundle-RequiredExecutionEnvironment: JavaSE-11
`;
}

function generatePluginProperties(themeName: string, author: string): string {
  return `pluginName=${escapeXml(themeName)} Theme
providerName=${escapeXml(author)}
`;
}

function generateEpf(
  manifest: Manifest,
  overlay: EditorOverlay | null
): string {
  const mergedTokens = mergeTokenOverrides(manifest, overlay || null);
  let epf = `# Eclipse Color Theme Preferences
# Generated by ThemeBooth
# Import into Eclipse: File > Import > General > Preferences

`;

  const epfEntries = new Map<string, { color: string; bold?: boolean; italic?: boolean }>();

  for (const rule of mergedTokens) {
    const epfKeys = SCOPE_TO_EPF_KEY[rule.scope] || [];

    for (const key of epfKeys) {
      const foreground = rule.settings.foreground || "#000000";
      epfEntries.set(key + ".color", {
        color: foreground,
      });

      if (rule.settings.fontStyle) {
        if (rule.settings.fontStyle.includes("bold")) {
          epfEntries.set(key + ".bold", { color: "true" });
        }
        if (rule.settings.fontStyle.includes("italic")) {
          epfEntries.set(key + ".italic", { color: "true" });
        }
      }
    }
  }

  for (const [key, value] of epfEntries.entries()) {
    const rgbColor = hexToRgbString(value.color);
    if (key.endsWith(".color")) {
      epf += `/instance/org.eclipse.jdt.ui/${key}=${rgbColor}\n`;
    } else {
      epf += `/instance/org.eclipse.jdt.ui/${key}=${value.color}\n`;
    }
  }

  return epf;
}

export function exportEclipse(
  manifest: Manifest,
  overlay: EditorOverlay | null
): EclipseExportPackage {
  const theme = buildEclipseColorTheme(manifest, overlay);

  const colorFileName = `${manifest.name}.eclipse-color-theme.xml`;
  const colorThemeXml = serializeEclipseXml(theme);
  const pluginXml = generateEclipsePluginXml(manifest.name, colorFileName);
  const manifestMf = generateManifestMf(
    manifest.name,
    manifest.version,
    manifest.author || "ThemeBooth"
  );
  const pluginProperties = generatePluginProperties(
    manifest.name,
    manifest.author || "ThemeBooth"
  );
  const epfContent = generateEpf(manifest, overlay);

  return {
    colorThemeXml,
    pluginXml,
    manifestMf,
    pluginProperties,
    epfContent,
  };
}

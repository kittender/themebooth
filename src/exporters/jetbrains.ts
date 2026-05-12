import * as fs from "fs/promises";
import * as path from "path";
import { Manifest } from "../core/manifest";
import { EditorOverlay } from "../core/overlay";
import { mergeTokenOverrides, TokenRule } from "./utils";

// Task 2.2: IJColorScheme TypeScript Interfaces

export interface IJSchemeOption {
  name: string;
  value: string;
}

export interface IJAttribute {
  name: string;
  baseAttribute?: string;
  value?: string;
}

export interface IJAttributesGroup {
  name: string;
  attributes: IJAttribute[];
}

export interface IJColorScheme {
  name: string;
  version: string;
  parentScheme: string;
  options: IJSchemeOption[];
  colors?: Record<string, string>;
  attributesGroups: IJAttributesGroup[];
}

// Plugin metadata for plugin.xml generation
export interface JetBrainsPluginMetadata {
  id: string;
  name: string;
  version: string;
  vendor: {
    name: string;
    email: string;
  };
  description: string;
  changeNotes: string;
  sinceBuild: string;
  untilBuild?: string;
  url?: string;
}

export interface JetBrainsExportPackage {
  colorScheme: IJColorScheme;
  pluginMetadata: JetBrainsPluginMetadata;
}

// Task 2.1: jetbrains.json overlay structure (documentation)
export interface JetBrainsOverlay extends EditorOverlay {
  colors?: Record<string, string>;
  tokenOverrides?: Record<string, Record<string, string>>;
  semanticTokens?: Record<string, Record<string, string>>;
}

// Semantic token configuration
export interface SemanticTokenConfig {
  foreground?: string;
  background?: string;
  fontStyle?: "bold" | "italic" | "underline" | "bold italic" | string;
}

// Token scope to IntelliJ attribute mapping
const SCOPE_TO_ATTRIBUTE_MAP: Record<string, string> = {
  keyword: "KEYWORD",
  string: "STRING",
  "string.literal": "STRING",
  "string.template": "STRING_TEMPLATE_EXPRESSION",
  comment: "COMMENTS",
  "comment.line": "COMMENTS",
  "comment.block": "COMMENTS",
  function: "FUNCTION_DECLARATION",
  "function.call": "FUNCTION_CALL",
  "function.declaration": "FUNCTION_DECLARATION",
  variable: "LOCAL_VARIABLE",
  "variable.declaration": "LOCAL_VARIABLE",
  "variable.parameter": "PARAMETER",
  class: "CLASS_NAME",
  "class.declaration": "CLASS_NAME",
  type: "CLASS_NAME",
  constant: "CONSTANT",
  operator: "OPERATION_SIGN",
  number: "NUMBER",
  boolean: "BOOLEAN",
  tag: "XML_TAG",
  attribute: "XML_ATTRIBUTE_NAME",
};

function mapScopeToAttribute(scope: string): string {
  return SCOPE_TO_ATTRIBUTE_MAP[scope] || scope.toUpperCase();
}

function fontStyleToBitFlag(fontStyle?: string): string {
  if (!fontStyle) return "0";
  const flags: Record<string, number> = {
    bold: 1,
    italic: 2,
    underline: 4,
  };

  let total = 0;
  const styles = fontStyle.split(" ").filter(Boolean);
  for (const style of styles) {
    if (flags[style]) {
      total |= flags[style];
    }
  }
  return String(total);
}

function hexToRgbHex(hex: string): string {
  // Convert #RRGGBB to RRGGBB (remove #)
  return hex.replace("#", "").toLowerCase();
}

function buildAttributeValue(
  foreground?: string,
  background?: string,
  fontStyle?: string
): string {
  const parts: string[] = [];

  if (fontStyle) {
    const flag = fontStyleToBitFlag(fontStyle);
    parts.push(`&quot;fontStyle&quot;:&quot;${flag}&quot;`);
  }

  if (foreground) {
    const rgb = hexToRgbHex(foreground);
    parts.push(`&quot;foreground&quot;:&quot;${rgb}&quot;`);
  }

  if (background) {
    const rgb = hexToRgbHex(background);
    parts.push(`&quot;background&quot;:&quot;${rgb}&quot;`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `{${parts.join(",")}}`;
}

function buildGlobalOptions(
  colors: Record<string, string | null>
): IJSchemeOption[] {
  const colorMap: Record<string, string> = {
    "editor.background": "BACKGROUND",
    "editor.foreground": "FOREGROUND",
    "editor.lineNumbers": "LINE_NUMBERS_COLOR",
    "editor.lineNumbersBackground": "GUTTER_BACKGROUND",
    "editor.selection": "SELECTION_BACKGROUND",
    "editor.selectionForeground": "SELECTION_FOREGROUND",
    "editor.cursor": "CARET_COLOR",
    "editor.cursorLine": "CARET_ROW_COLOR",
    "editor.indentGuide": "INDENT_GUIDE_COLOR",
    "editor.whitespace": "WHITESPACE",
  };

  const options: IJSchemeOption[] = [];

  for (const [themebooth, jetbrainsOption] of Object.entries(colorMap)) {
    const colorValue = colors[themebooth];
    if (colorValue && typeof colorValue === "string") {
      options.push({
        name: jetbrainsOption,
        value: hexToRgbHex(colorValue),
      });
    }
  }

  return options;
}

function buildTokenAttributes(rules: TokenRule[]): IJAttributesGroup[] {
  // Group attributes by semantic category
  const grouped: Record<string, IJAttribute[]> = {};

  for (const rule of rules) {
    const attributeName = mapScopeToAttribute(rule.scope);
    const { foreground, background, fontStyle } = rule.settings;

    if (!foreground && !background && !fontStyle) {
      continue;
    }

    const value = buildAttributeValue(foreground, background, fontStyle);
    if (!value) {
      continue;
    }

    // Simple grouping: by attribute prefix (e.g., "COMMENT" group for comment-related)
    const groupKey = attributeName.split("_")[0] || "OTHER";

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }

    grouped[groupKey].push({
      name: attributeName,
      value,
    });
  }

  // Convert to JetBrains format
  return Object.entries(grouped).map(([groupName, attributes]) => ({
    name: groupName,
    attributes,
  }));
}

export function exportIntelliJ(
  manifest: Manifest,
  overlay: EditorOverlay | null
): IJColorScheme {
  const merged = mergeTokenOverrides(manifest, overlay);
  const mergedColors = { ...manifest.colors, ...overlay?.colors };

  const options = buildGlobalOptions(mergedColors);
  const attributesGroups = buildTokenAttributes(merged);

  return {
    name: manifest.name,
    version: "142",
    parentScheme: "Default",
    options,
    attributesGroups,
  };
}

export function buildPluginMetadata(manifest: Manifest): JetBrainsPluginMetadata {
  const id = `com.themebooth.${manifest.name.toLowerCase().replace(/\s+/g, "-")}`;
  const version = manifest.version || "1.0.0";

  return {
    id,
    name: manifest.name,
    version,
    vendor: {
      name: manifest.author,
      email: "",
    },
    description: manifest.description || `${manifest.name} color scheme`,
    changeNotes: `Version ${version}: Theme by ${manifest.author}`,
    sinceBuild: "211.0",
  };
}

// Task 3.3: XML Serialization for .icls
function escapeXmlValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function serializeIclsXml(scheme: IJColorScheme): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<scheme name="${escapeXmlValue(scheme.name)}" version="${scheme.version}" parent_scheme="${scheme.parentScheme}">`,
  ];

  // Add global color options
  for (const option of scheme.options) {
    lines.push(
      `  <option name="${escapeXmlValue(option.name)}" value="${escapeXmlValue(option.value)}" />`
    );
  }

  // Add token attributes
  if (scheme.attributesGroups.length > 0) {
    lines.push("  <attributes>");
    for (const group of scheme.attributesGroups) {
      lines.push(`    <attributesGroup name="${escapeXmlValue(group.name)}">`);
      for (const attr of group.attributes) {
        if (attr.baseAttribute) {
          lines.push(
            `      <attribute name="${escapeXmlValue(attr.name)}" baseAttribute="${escapeXmlValue(attr.baseAttribute)}" />`
          );
        } else if (attr.value) {
          lines.push(
            `      <attribute name="${escapeXmlValue(attr.name)}" value="${escapeXmlValue(attr.value)}" />`
          );
        }
      }
      lines.push("    </attributesGroup>");
    }
    lines.push("  </attributes>");
  }

  lines.push("</scheme>");
  return lines.join("\n");
}

// Task 3.2: Generate plugin.xml boilerplate
export function generatePluginXml(metadata: JetBrainsPluginMetadata, themeFileName: string): string {
  const vendorEmail = metadata.vendor.email ? ` email="${escapeXmlValue(metadata.vendor.email)}"` : "";
  const vendorUrl = metadata.url ? ` url="${escapeXmlValue(metadata.url)}"` : "";

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<idea-plugin>',
    `  <id>${escapeXmlValue(metadata.id)}</id>`,
    `  <name>${escapeXmlValue(metadata.name)}</name>`,
    `  <version>${escapeXmlValue(metadata.version)}</version>`,
    `  <vendor${vendorEmail}${vendorUrl}>${escapeXmlValue(metadata.vendor.name)}</vendor>`,
    `  <description>${escapeXmlValue(metadata.description)}</description>`,
    `  <change-notes>${escapeXmlValue(metadata.changeNotes)}</change-notes>`,
    `  <idea-version since-build="${metadata.sinceBuild}"${metadata.untilBuild ? ` until-build="${metadata.untilBuild}"` : ""} />`,
    '  <extensions defaultExtensionNs="com.intellij">',
    `    <themeProvider path="/theme/${themeFileName}" />`,
    "  </extensions>",
    "</idea-plugin>",
  ];

  return lines.join("\n");
}

// Task 3.4: Package creation function
export async function createIntellijPackageStructure(
  outputDir: string,
  colorSchemeXml: string,
  pluginXml: string,
  packageName: string,
  themeFileName: string
): Promise<void> {
  const packagePath = path.join(outputDir, packageName);
  const themePath = path.join(packagePath, "theme");
  const metaInfPath = path.join(packagePath, "META-INF");

  // Create directories
  await fs.mkdir(themePath, { recursive: true });
  await fs.mkdir(metaInfPath, { recursive: true });

  // Write plugin.xml
  await fs.writeFile(path.join(packagePath, "plugin.xml"), pluginXml);

  // Write color scheme
  await fs.writeFile(path.join(themePath, themeFileName), colorSchemeXml);

  // Write MANIFEST.MF
  const manifest = "Manifest-Version: 1.0\nCreated-By: Themebooth\n";
  await fs.writeFile(path.join(metaInfPath, "MANIFEST.MF"), manifest);
}

// Export multi-file package with all files
export interface IntellijExportResult {
  colorSchemeXml: string;
  pluginXml: string;
  packagePath: string;
}

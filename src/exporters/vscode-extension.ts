import { Manifest } from "../core/manifest";
import { exportVSCode, VSCodeTheme } from "./vscode";
import { hexToRgb } from "../core/colors";

export interface VSCodeExtensionPackage {
  packageJson: Record<string, unknown>;
  extensionTs: string;
  themeJson: VSCodeTheme;
  vscodeignore: string;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function detectThemeMode(manifest: Manifest): "vs-dark" | "vs" {
  const bgColor = manifest.colors?.["editor.background"];
  if (!bgColor) return "vs-dark";

  const rgb = hexToRgb(bgColor);
  if (!rgb) return "vs-dark";

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "vs" : "vs-dark";
}

export function exportVSCodeExtension(manifest: Manifest): VSCodeExtensionPackage {
  const slug = slugify(manifest.name);
  const authorSlug = manifest.author ? slugify(manifest.author) : "themebooth";
  const themeMode = detectThemeMode(manifest);

  const themeJson = exportVSCode(manifest);

  const packageJson = {
    name: slug,
    displayName: manifest.name,
    description:
      manifest.description ||
      `${manifest.name} theme for Visual Studio Code`,
    version: manifest.version,
    publisher: authorSlug,
    engines: {
      vscode: "^1.74.0",
    },
    categories: ["Themes"],
    keywords: ["theme", "color-scheme", "dark", "light"],
    repository: manifest.colors?.["theme.repository"] || undefined,
    homepage: manifest.colors?.["theme.homepage"] || undefined,
    contributes: {
      themes: [
        {
          label: manifest.name,
          uiTheme: themeMode,
          path: `./themes/${slug}-color-theme.json`,
        },
      ],
    },
  };

  const extensionTs = `import * as vscode from 'vscode';

export function activate(_context: vscode.ExtensionContext): void {
  // Theme activation handled by VS Code
}

export function deactivate(): void {
  // Cleanup if needed
}
`;

  const vscodeignore = `**/*.ts
src/
*.json
!themes/**
!package.json
node_modules/
.vscode/
.git/
.gitignore
`;

  return {
    packageJson,
    extensionTs,
    themeJson,
    vscodeignore,
  };
}

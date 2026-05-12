import { describe, it, expect } from "vitest";
import { exportVSCodeExtension } from "../../src/exporters/vscode-extension";
import type { Manifest } from "../../src/core/manifest";

const mockDarkManifest: Manifest = {
  name: "dark-theme",
  displayName: "Dark Theme",
  version: "1.0.0",
  description: "A dark color theme",
  author: "Test Author",
  variables: {},
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editor.selectionBackground": "#264f78",
  },
  tokens: {
    keyword: { foreground: "#569cd6" },
    string: { foreground: "#ce9178" },
    comment: { foreground: "#6a9955" },
  },
  semanticTokens: {},
  languageTokens: {},
  presets: {},
};

const mockLightManifest: Manifest = {
  ...mockDarkManifest,
  name: "light-theme",
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#000000",
    "editor.selectionBackground": "#add6ff",
  },
};

describe("VS Code Extension Exporter", () => {
  it("should return all required files", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.packageJson).toBeDefined();
    expect(result.extensionTs).toBeDefined();
    expect(result.themeJson).toBeDefined();
    expect(result.vscodeignore).toBeDefined();
  });

  it("should generate valid package.json", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.packageJson.name).toBe("dark-theme");
    expect(result.packageJson.displayName).toBe("Dark Theme");
    expect(result.packageJson.version).toBe("1.0.0");
    expect(result.packageJson.description).toBe("A dark color theme");
    expect(result.packageJson.publisher).toBe("test-author");
    expect(result.packageJson.engines).toEqual({ vscode: "^1.74.0" });
    expect(result.packageJson.categories).toEqual(["Themes"]);
  });

  it("should include theme contribution in package.json", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.packageJson.contributes).toBeDefined();
    expect(result.packageJson.contributes.themes).toBeDefined();
    expect(Array.isArray(result.packageJson.contributes.themes)).toBe(true);
    expect(result.packageJson.contributes.themes[0].label).toBe("Dark Theme");
  });

  it("should set correct uiTheme for dark background", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.packageJson.contributes.themes[0].uiTheme).toBe("vs-dark");
  });

  it("should set correct uiTheme for light background", () => {
    const result = exportVSCodeExtension(mockLightManifest);

    expect(result.packageJson.contributes.themes[0].uiTheme).toBe("vs");
  });

  it("should reference correct theme file path", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.packageJson.contributes.themes[0].path).toBe(
      "./themes/dark-theme-color-theme.json"
    );
  });

  it("should generate valid TypeScript extension boilerplate", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.extensionTs).toContain("import * as vscode from 'vscode'");
    expect(result.extensionTs).toContain("export function activate");
    expect(result.extensionTs).toContain("export function deactivate");
  });

  it("should generate valid .vscodeignore", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.vscodeignore).toContain("**/*.ts");
    expect(result.vscodeignore).toContain("!themes/**");
    expect(result.vscodeignore).toContain("node_modules/");
    expect(result.vscodeignore).toContain(".vscode/");
  });

  it("should include tokenColors in theme JSON", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.themeJson).toBeDefined();
    expect(result.themeJson.tokenColors).toBeDefined();
    expect(Array.isArray(result.themeJson.tokenColors)).toBe(true);
  });

  it("should include colors in theme JSON", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.themeJson.colors).toBeDefined();
    expect(typeof result.themeJson.colors).toBe("object");
  });

  it("should slugify theme name for package name", () => {
    const manifest: Manifest = {
      ...mockDarkManifest,
      name: "My Dark Theme",
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.name).toBe("my-dark-theme");
  });

  it("should slugify author for publisher", () => {
    const manifest: Manifest = {
      ...mockDarkManifest,
      author: "Test Author Name",
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.publisher).toBe("test-author-name");
  });

  it("should handle missing author", () => {
    const manifest: Manifest = {
      ...mockDarkManifest,
      author: undefined,
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.publisher).toBe("themebooth");
  });

  it("should use default description if not provided", () => {
    const manifest: Manifest = {
      ...mockDarkManifest,
      description: undefined,
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.description).toContain("dark-theme");
    expect(result.packageJson.description).toContain("Visual Studio Code");
  });

  it("should handle special characters in theme name", () => {
    const manifest: Manifest = {
      ...mockDarkManifest,
      name: "My (Dark) Theme!",
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.name).toBe("my-dark-theme");
  });

  it("should default to vs-dark when no background color specified", () => {
    const manifest: Manifest = {
      ...mockDarkManifest,
      colors: {},
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.contributes.themes[0].uiTheme).toBe("vs-dark");
  });

  it("should detect light theme by luminance", () => {
    // Light gray should be detected as light
    const manifest: Manifest = {
      ...mockDarkManifest,
      colors: {
        "editor.background": "#f0f0f0",
      },
    };

    const result = exportVSCodeExtension(manifest);

    expect(result.packageJson.contributes.themes[0].uiTheme).toBe("vs");
  });

  it("should handle edge case colors for luminance", () => {
    // Pure white
    const whiteManifest: Manifest = {
      ...mockDarkManifest,
      colors: {
        "editor.background": "#ffffff",
      },
    };

    const whiteResult = exportVSCodeExtension(whiteManifest);
    expect(whiteResult.packageJson.contributes.themes[0].uiTheme).toBe("vs");

    // Pure black
    const blackManifest: Manifest = {
      ...mockDarkManifest,
      colors: {
        "editor.background": "#000000",
      },
    };

    const blackResult = exportVSCodeExtension(blackManifest);
    expect(blackResult.packageJson.contributes.themes[0].uiTheme).toBe("vs-dark");
  });

  it("should include keywords in package.json", () => {
    const result = exportVSCodeExtension(mockDarkManifest);

    expect(result.packageJson.keywords).toBeDefined();
    expect(Array.isArray(result.packageJson.keywords)).toBe(true);
    expect(result.packageJson.keywords).toContain("theme");
  });
});

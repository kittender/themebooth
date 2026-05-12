import * as fs from "fs/promises";
import * as path from "path";
import * as fsSync from "fs";
import { transpileTheme } from "../transpiler";

describe("Transpiler: JetBrains Export", () => {
  let tempDir: string;
  let testThemeDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tempDir = path.join(__dirname, ".temp-jetbrains-test-" + Date.now());
    testThemeDir = path.join(tempDir, "test-theme");
    outputDir = path.join(tempDir, "output");

    await fs.mkdir(testThemeDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      if (fsSync.existsSync(tempDir)) {
        await fs.rm(tempDir, { recursive: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should transpile theme to JetBrains format", async () => {
    // Create manifest
    const manifest = {
      name: "Test Theme",
      author: "Test Author",
      version: "1.0.0",
      description: "Test theme",
      variables: {
        darkBg: "#1e1e1e",
        lightFg: "#d4d4d4",
      },
      colors: {
        "editor.background": "$darkBg",
        "editor.foreground": "$lightFg",
        "editor.lineNumbers": "#858585",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
        string: {
          foreground: "#ce9178",
        },
      },
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Transpile
    const result = await transpileTheme(manifestPath, outputDir);

    // Check overall success
    expect(result.results.length).toBeGreaterThan(0);

    // Check JetBrains export results
    const jetbrainsResults = result.results.filter(
      (r) => r.platform === "JetBrains"
    );
    expect(jetbrainsResults.length).toBeGreaterThan(0);

    // At least one should succeed
    const successfulResult = jetbrainsResults.find((r) => r.success);
    expect(successfulResult).toBeDefined();

    if (successfulResult?.path) {
      expect(successfulResult.path).toContain(".icls");
    }
  });

  it("should generate valid .icls XML file", async () => {
    const manifest = {
      name: "Test Theme",
      author: "Test Author",
      version: "1.0.0",
      description: "Test",
      variables: {},
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      tokens: {
        keyword: { foreground: "#569cd6" },
      },
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    await transpileTheme(manifestPath, outputDir);

    // Find .icls file
    const files = await fs.readdir(outputDir);
    const iclsFile = files.find((f) => f.endsWith(".icls"));

    expect(iclsFile).toBeDefined();

    if (iclsFile) {
      const content = await fs.readFile(path.join(outputDir, iclsFile), "utf-8");

      // Check XML structure
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain("<scheme");
      expect(content).toContain("</scheme>");
      expect(content).toContain("<attributes>");
      expect(content).toContain("</attributes>");

      // Check theme name
      expect(content).toContain('name="Test Theme"');

      // Check colors
      expect(content).toContain("BACKGROUND");
      expect(content).toContain("FOREGROUND");
    }
  });

  it("should generate plugin.xml metadata file", async () => {
    const manifest = {
      name: "Test Theme",
      author: "Test Author",
      version: "1.0.0",
      description: "Test description",
      variables: {},
      colors: {},
      tokens: {},
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    await transpileTheme(manifestPath, outputDir);

    // Check for plugin.xml
    const pluginXmlPath = path.join(outputDir, "plugin.xml");
    const pluginXmlExists = fsSync.existsSync(pluginXmlPath);
    expect(pluginXmlExists).toBe(true);

    if (pluginXmlExists) {
      const content = await fs.readFile(pluginXmlPath, "utf-8");

      // Check XML structure
      expect(content).toContain("<idea-plugin>");
      expect(content).toContain("</idea-plugin>");
      expect(content).toContain("<id>");
      expect(content).toContain("<name>");
      expect(content).toContain("<version>");
      expect(content).toContain("<vendor>");
      expect(content).toContain("<idea-version");
      expect(content).toContain("<themeProvider");

      // Check metadata
      expect(content).toContain("Test Theme");
      expect(content).toContain("Test Author");
      expect(content).toContain("1.0.0");
    }
  });

  it("should merge jetbrains.json overlay", async () => {
    const manifest = {
      name: "Test Theme",
      author: "Test Author",
      version: "1.0.0",
      description: "Test",
      variables: {},
      colors: {
        "editor.background": "#000000",
        "editor.foreground": "#ffffff",
      },
      tokens: {
        keyword: { foreground: "#111111" },
      },
    };

    const overlay = {
      inherits: "base",
      colors: {
        "editor.background": "#1e1e1e",
      },
      tokenOverrides: {
        keyword: { foreground: "#569cd6" },
      },
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    const overlayPath = path.join(testThemeDir, "jetbrains.json");

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    await fs.writeFile(overlayPath, JSON.stringify(overlay, null, 2));

    await transpileTheme(manifestPath, outputDir);

    // Find .icls file and check it has overlay values
    const files = await fs.readdir(outputDir);
    const iclsFile = files.find((f) => f.endsWith(".icls"));

    if (iclsFile) {
      const content = await fs.readFile(path.join(outputDir, iclsFile), "utf-8");

      // Background should be from overlay (1e1e1e not 000000)
      expect(content).toContain("1e1e1e");
      expect(content).not.toContain("000000");

      // Keyword color should be from overlay (569cd6)
      expect(content).toContain("569cd6");
    }
  });

  it("should handle color variables in overlay", async () => {
    const manifest = {
      name: "Test Theme",
      author: "Test Author",
      version: "1.0.0",
      description: "Test",
      variables: {
        accentBlue: "#569cd6",
        darkBg: "#1e1e1e",
      },
      colors: {
        "editor.background": "$darkBg",
        "editor.foreground": "#d4d4d4",
      },
      tokens: {},
    };

    const overlay = {
      inherits: "base",
      tokenOverrides: {
        keyword: { foreground: "$accentBlue" },
      },
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    const overlayPath = path.join(testThemeDir, "jetbrains.json");

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    await fs.writeFile(overlayPath, JSON.stringify(overlay, null, 2));

    // Should not throw error with unresolved variables
    const result = await transpileTheme(manifestPath, outputDir);

    const jetbrainsResults = result.results.filter(
      (r) => r.platform === "JetBrains"
    );
    expect(jetbrainsResults.some((r) => r.success)).toBe(true);
  });

  it("should handle missing jetbrains.json gracefully", async () => {
    const manifest = {
      name: "Test Theme",
      author: "Test Author",
      version: "1.0.0",
      description: "Test",
      variables: {},
      colors: {
        "editor.background": "#1e1e1e",
      },
      tokens: {
        keyword: { foreground: "#569cd6" },
      },
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // No jetbrains.json file created
    const result = await transpileTheme(manifestPath, outputDir);

    // Should still succeed with base manifest
    const jetbrainsResults = result.results.filter(
      (r) => r.platform === "JetBrains"
    );
    expect(jetbrainsResults.some((r) => r.success)).toBe(true);
  });

  it("should export all required JetBrains output files", async () => {
    const manifest = {
      name: "CompleteTest",
      author: "Test Author",
      version: "1.0.0",
      description: "Test",
      variables: {},
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      tokens: {
        keyword: { foreground: "#569cd6" },
      },
    };

    const manifestPath = path.join(testThemeDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    await transpileTheme(manifestPath, outputDir);

    // Check for .icls file
    const files = await fs.readdir(outputDir);
    expect(files.some((f) => f.endsWith(".icls"))).toBe(true);

    // Check for plugin.xml
    expect(files.some((f) => f === "plugin.xml")).toBe(true);
  });
});

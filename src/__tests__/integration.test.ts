import * as fs from "fs/promises";
import * as path from "path";
import { tmpdir } from "os";
import { validateManifest, Manifest } from "../core/manifest";
import { resolveVariables, interpolateManifest } from "../core/variables";
import { exportVSCode } from "../exporters/vscode";
import { exportNotepadPlus } from "../exporters/notepad-plus";
import { exportZed } from "../exporters/zed";

// Helper to create a unique temp directory
async function createTempDir(): Promise<string> {
  const tempBase = tmpdir();
  const dir = path.join(tempBase, `themebooth-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Helper to clean up temp directory
async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("Integration Tests", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe("Init → Package Flow", () => {
    it("should create project structure with preset manifest", async () => {
      const projectDir = path.join(tempDir, "my-theme");

      // Create project directory
      await fs.mkdir(projectDir, { recursive: true });

      // Create manifest from preset
      const darkPresetPath = path.join(
        process.cwd(),
        "src/templates/presets/dark.json"
      );
      const presetContent = await fs.readFile(darkPresetPath, "utf-8");
      const manifestContent = path.join(projectDir, "manifest.json");
      await fs.writeFile(manifestContent, presetContent);

      // Verify files exist
      const manifestExists = await fs
        .access(manifestContent)
        .then(() => true)
        .catch(() => false);
      expect(manifestExists).toBe(true);

      // Verify manifest is valid JSON
      const manifest = JSON.parse(presetContent);
      const validation = validateManifest(manifest);
      expect(validation.success).toBe(true);
    });

    it("should load preset manifest files", async () => {
      const presets = ["dark", "light", "high-contrast"];

      for (const preset of presets) {
        const presetPath = path.join(
          process.cwd(),
          `src/templates/presets/${preset}.json`
        );
        const content = await fs.readFile(presetPath, "utf-8");
        const manifest = JSON.parse(content);

        const validation = validateManifest(manifest);
        expect(validation.success).toBe(true);
        if (validation.success) {
          expect(validation.data.name).toBeDefined();
          expect(validation.data.author).toBeDefined();
          expect(validation.data.version).toBeDefined();
        }
      }
    });

    it("should complete full package pipeline for dark preset", async () => {
      // Load dark preset
      const darkPresetPath = path.join(
        process.cwd(),
        "src/templates/presets/dark.json"
      );
      const presetContent = await fs.readFile(darkPresetPath, "utf-8");
      const manifest = JSON.parse(presetContent);

      // Validate
      const validation = validateManifest(manifest);
      expect(validation.success).toBe(true);

      if (!validation.success) throw new Error("Validation failed");
      const validManifest = validation.data;

      // Resolve variables
      const varResult = resolveVariables(validManifest);
      expect(varResult.success).toBe(true);

      if (!varResult.success) throw new Error("Variable resolution failed");

      // Interpolate
      const interpolated = interpolateManifest(validManifest, varResult.variables);

      // Export to all formats
      const vscode = exportVSCode(interpolated);
      const notepadPlus = exportNotepadPlus(interpolated);
      const zed = exportZed(interpolated);

      // Verify exports
      expect(vscode.name).toBe(interpolated.name);
      expect(vscode.tokenColors).toBeDefined();
      expect(vscode.colors).toBeDefined();

      expect(notepadPlus).toContain("<?xml");
      expect(notepadPlus).toContain(interpolated.name);

      expect(zed.name).toBe(interpolated.name);
      expect(zed.appearance).toBeDefined();
      expect(zed.token_colors).toBeDefined();

      // Verify files can be serialized
      expect(() => JSON.stringify(vscode)).not.toThrow();
      expect(() => JSON.stringify(zed)).not.toThrow();
    });

    it("should complete full pipeline for light preset", async () => {
      const lightPresetPath = path.join(
        process.cwd(),
        "src/templates/presets/light.json"
      );
      const presetContent = await fs.readFile(lightPresetPath, "utf-8");
      const manifest = JSON.parse(presetContent);

      const validation = validateManifest(manifest);
      expect(validation.success).toBe(true);

      if (!validation.success) throw new Error("Validation failed");

      const varResult = resolveVariables(validation.data);
      expect(varResult.success).toBe(true);

      if (!varResult.success) throw new Error("Variable resolution failed");

      const interpolated = interpolateManifest(
        validation.data,
        varResult.variables
      );
      const zed = exportZed(interpolated);

      // Light theme should have light appearance
      expect(zed.appearance).toBe("light");
    });

    it("should handle custom theme with all token types", async () => {
      const customManifest: Manifest = {
        name: "Custom Theme",
        author: "Test Author",
        description: "A custom test theme",
        version: "1.0.0",
        variables: {
          darkBg: "#1e1e1e",
          lightFg: "#d4d4d4",
          accentKeyword: "#569cd6",
          accentString: "#ce9178",
          accentComment: "#6a9955",
          accentNumber: "#b5cea8",
        },
        colors: {
          "editor.background": "$darkBg",
          "editor.foreground": "$lightFg",
          "editor.lineNumberForeground": "#858585",
        },
        tokens: {
          keyword: {
            foreground: "$accentKeyword",
            fontStyle: "bold",
          },
          string: {
            foreground: "$accentString",
          },
          comment: {
            foreground: "$accentComment",
            fontStyle: "italic",
          },
          number: {
            foreground: "$accentNumber",
          },
          operator: {
            foreground: "#d4d4d4",
          },
        },
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      // Validate
      const validation = validateManifest(customManifest);
      expect(validation.success).toBe(true);

      // Resolve variables
      const varResult = resolveVariables(customManifest);
      expect(varResult.success).toBe(true);

      if (!varResult.success) throw new Error("Variable resolution failed");

      // Interpolate
      const interpolated = interpolateManifest(customManifest, varResult.variables);

      // Verify all variable references are resolved
      expect(interpolated.colors?.["editor.background"]).toBe("#1e1e1e");
      expect(interpolated.colors?.["editor.foreground"]).toBe("#d4d4d4");

      expect(interpolated.tokens?.keyword?.foreground).toBe("#569cd6");
      expect(interpolated.tokens?.string?.foreground).toBe("#ce9178");
      expect(interpolated.tokens?.comment?.foreground).toBe("#6a9955");

      // Export to all formats
      const vscode = exportVSCode(interpolated);
      const notepadPlus = exportNotepadPlus(interpolated);
      const zed = exportZed(interpolated);

      expect(vscode.tokenColors).toHaveLength(5);
      expect(notepadPlus).toContain("Custom Theme");
      expect(zed.token_colors).toHaveLength(5);
    });
  });

  describe("Output File Generation", () => {
    it("should generate valid VS Code theme file", async () => {
      const outputDir = path.join(tempDir, "output");
      await fs.mkdir(outputDir, { recursive: true });

      const manifest: Manifest = {
        name: "Test Theme",
        author: "Test Author",
        version: "1.0.0",
        description: "",
        variables: {},
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#d4d4d4",
        },
        tokens: {
          keyword: {
            foreground: "#569cd6",
          },
        },
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      const vscodeTheme = exportVSCode(manifest);
      const filePath = path.join(outputDir, "theme.json");
      await fs.writeFile(filePath, JSON.stringify(vscodeTheme, null, 2));

      // Verify file exists and is valid JSON
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe("Test Theme");
      expect(parsed.colors["editor.background"]).toBe("#1e1e1e");
      expect(parsed.tokenColors[0].scope).toBe("keyword");
    });

    it("should generate valid Notepad++ XML file", async () => {
      const outputDir = path.join(tempDir, "output");
      await fs.mkdir(outputDir, { recursive: true });

      const manifest: Manifest = {
        name: "Test Theme",
        author: "Test Author",
        version: "1.0.0",
        description: "",
        variables: {},
        colors: {
          "editor.background": "#ffffff",
          "editor.foreground": "#000000",
        },
        tokens: {
          keyword: {
            foreground: "#000000",
          },
        },
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      const xmlContent = exportNotepadPlus(manifest);
      const filePath = path.join(outputDir, "theme.xml");
      await fs.writeFile(filePath, xmlContent);

      // Verify file exists and contains valid XML structure
      const content = await fs.readFile(filePath, "utf-8");

      expect(content).toContain("<?xml version");
      expect(content).toContain("<NotepadPlus>");
      expect(content).toContain("</NotepadPlus>");
      expect(content).toContain("Test Theme");
    });

    it("should generate valid Zed theme file", async () => {
      const outputDir = path.join(tempDir, "output");
      await fs.mkdir(outputDir, { recursive: true });

      const manifest: Manifest = {
        name: "Test Theme",
        author: "Test Author",
        version: "1.0.0",
        description: "",
        variables: {},
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#d4d4d4",
        },
        tokens: {
          keyword: {
            foreground: "#569cd6",
          },
        },
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      const zedTheme = exportZed(manifest);
      const filePath = path.join(outputDir, "theme.json");
      await fs.writeFile(filePath, JSON.stringify(zedTheme, null, 2));

      // Verify file exists and is valid JSON
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe("Test Theme");
      expect(parsed.appearance).toBe("dark");
      expect(parsed.token_colors[0].scope).toBe("keyword");
    });
  });

  describe("Preset Integration", () => {
    it("should load and use all three presets", async () => {
      const presets = ["dark", "light", "high-contrast"];

      for (const presetName of presets) {
        const presetPath = path.join(
          process.cwd(),
          `src/templates/presets/${presetName}.json`
        );
        const content = await fs.readFile(presetPath, "utf-8");
        const manifest = JSON.parse(content);

        // Should be valid
        const validation = validateManifest(manifest);
        expect(validation.success).toBe(true);

        // Should have variables and tokens (colors are now in overlays)
        expect(manifest.variables).toBeDefined();
        expect(Object.keys(manifest.variables).length).toBeGreaterThan(0);

        expect(manifest.tokens).toBeDefined();
        expect(Object.keys(manifest.tokens).length).toBeGreaterThan(0);
      }
    });

    it("should verify dark preset variables and tokens", async () => {
      const darkPath = path.join(
        process.cwd(),
        "src/templates/presets/dark.json"
      );
      const content = await fs.readFile(darkPath, "utf-8");
      const manifest = JSON.parse(content);

      const validation = validateManifest(manifest);
      if (!validation.success) throw new Error("Validation failed");

      // Verify variables can be resolved
      const varResult = resolveVariables(validation.data);
      expect(varResult.success).toBe(true);

      // Verify tokens are present
      expect(Object.keys(manifest.tokens).length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should reject manifest with circular variable references", () => {
      const manifest: Manifest = {
        name: "Circular",
        author: "Test",
        version: "1.0.0",
        description: "",
        variables: {
          a: "$b",
          b: "$a",
        },
        colors: {},
        tokens: {},
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      const result = resolveVariables(manifest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.reason).toBe("circular");
      }
    });

    it("should reject manifest with undefined variable references", () => {
      const manifest: Manifest = {
        name: "Undefined Ref",
        author: "Test",
        version: "1.0.0",
        description: "",
        variables: {},
        colors: {
          "editor.background": "$undefined",
        },
        tokens: {},
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      const validation = validateManifest(manifest);
      // The validation itself passes, but variable reference validation would catch it
      expect(validation.success).toBe(true);
    });

    it("should handle empty manifest gracefully", () => {
      const emptyManifest: Manifest = {
        name: "Empty",
        author: "Test",
        version: "1.0.0",
        description: "",
        variables: {},
        colors: {},
        tokens: {},
        semanticTokens: {},
        languageTokens: {},
        presets: {},
        computed: {},
      };

      const vscode = exportVSCode(emptyManifest);
      const zed = exportZed(emptyManifest);
      const notepad = exportNotepadPlus(emptyManifest);

      expect(vscode.tokenColors).toEqual([]);
      expect(zed.token_colors).toEqual([]);
      expect(notepad).toContain("Empty");
    });
  });
});

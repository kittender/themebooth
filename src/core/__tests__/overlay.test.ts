import fs from "fs";
import path from "path";
import os from "os";
import {
  loadOverlay,
  resolveOverlayVariables,
  mergeOverlayIntoManifest,
  EditorOverlay,
} from "../overlay";
import { Manifest } from "../manifest";

const createManifest = (partial: Partial<Manifest>): Manifest => ({
  name: "Test",
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
  ...partial,
});

const createTempDir = (): string => {
  return path.join(os.tmpdir(), `themebooth-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
};

const cleanupTempDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe("Overlay Loading and Merging", () => {
  it("should return null when overlay file does not exist", () => {
    const nonexistent = "/path/that/does/not/exist/overlay.json";
    const result = loadOverlay(nonexistent);
    expect(result).toBeNull();
  });

  it("should load a valid overlay file", () => {
    const tmpDir = createTempDir();
    try {
      const overlayPath = path.join(tmpDir, "vscode.json");
      const overlay: EditorOverlay = {
        inherits: "./manifest.json",
        colors: {
          "editor.background": "#1e1e1e",
        },
      };
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(overlayPath, JSON.stringify(overlay));

      const loaded = loadOverlay(overlayPath);
      expect(loaded).not.toBeNull();
      expect(loaded?.colors?.["editor.background"]).toBe("#1e1e1e");
    } finally {
      cleanupTempDir(tmpDir);
    }
  });

  it("should resolve variables in overlay colors", () => {
    const overlay: EditorOverlay = {
      inherits: "./manifest.json",
      colors: {
        "editor.background": "$color-bg-primary",
        "editor.foreground": "$color-fg-primary",
      },
    };

    const resolvedVariables = {
      "color-bg-primary": "#1e1e1e",
      "color-fg-primary": "#d4d4d4",
    };

    const resolved = resolveOverlayVariables(overlay, resolvedVariables);
    expect(resolved.colors?.["editor.background"]).toBe("#1e1e1e");
    expect(resolved.colors?.["editor.foreground"]).toBe("#d4d4d4");
  });

  it("should resolve variables in overlay LESS selectors", () => {
    const overlay: EditorOverlay = {
      inherits: "./manifest.json",
      less: {
        ".cm-keyword": {
          color: "$color-semantic-keyword",
        },
        ".cm-string": {
          color: "$color-semantic-string",
        },
      },
    };

    const resolvedVariables = {
      "color-semantic-keyword": "#569cd6",
      "color-semantic-string": "#ce9178",
    };

    const resolved = resolveOverlayVariables(overlay, resolvedVariables);
    expect(resolved.less?.[".cm-keyword"].color).toBe("#569cd6");
    expect(resolved.less?.[".cm-string"].color).toBe("#ce9178");
  });

  it("should merge overlay colors into manifest", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
    });

    const overlay: EditorOverlay = {
      inherits: "./manifest.json",
      colors: {
        "editor.background": "#1e1e1e",
        "editor.lineNumberForeground": "#858585",
      },
    };

    const merged = mergeOverlayIntoManifest(manifest, overlay);
    expect(merged.colors?.["editor.background"]).toBe("#1e1e1e");
    expect(merged.colors?.["editor.foreground"]).toBe("#000000");
    expect(merged.colors?.["editor.lineNumberForeground"]).toBe("#858585");
  });

  it("should merge overlay token overrides into manifest tokens", () => {
    const manifest = createManifest({
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontStyle: "normal",
        },
      },
    });

    const overlay: EditorOverlay = {
      inherits: "./manifest.json",
      tokenOverrides: {
        keyword: {
          fontStyle: "bold",
        },
      },
    };

    const merged = mergeOverlayIntoManifest(manifest, overlay);
    expect(merged.tokens?.keyword?.foreground).toBe("#569cd6");
    expect(merged.tokens?.keyword?.fontStyle).toBe("bold");
  });

  it("should preserve overlay null values for colors", () => {
    const manifest = createManifest({
      colors: {
        "editor.selectionForeground": "#d4d4d4",
      },
    });

    const overlay: EditorOverlay = {
      inherits: "./manifest.json",
      colors: {
        "editor.selectionForeground": null,
      },
    };

    const merged = mergeOverlayIntoManifest(manifest, overlay);
    expect(merged.colors?.["editor.selectionForeground"]).toBeNull();
  });

  it("should handle overlay with only LESS (no colors)", () => {
    const overlay: EditorOverlay = {
      inherits: "./manifest.json",
      less: {
        ".cm-tag": { color: "#569cd6" },
      },
    };

    const resolvedVariables = {};
    const resolved = resolveOverlayVariables(overlay, resolvedVariables);
    expect(resolved.less?.[".cm-tag"].color).toBe("#569cd6");
    expect(resolved.colors).toBeDefined();
  });
});

import { exportVSCode } from "../vscode";
import { exportNotepadPlus } from "../notepad-plus";
import { exportZed } from "../zed";
import { Manifest } from "../../core/manifest";

const createManifest = (partial: Partial<Manifest>): Manifest => ({
  name: "Test Theme",
  author: "Test Author",
  version: "1.0.0",
  description: "",
  variables: {},
  colors: {},
  tokens: {},
  presets: [],
  ...partial,
});

describe("VS Code Exporter", () => {
  it("should export basic theme structure", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
      },
    });

    const result = exportVSCode(manifest);

    expect(result.name).toBe("Test Theme");
    expect(result.colors["editor.background"]).toBe("#1e1e1e");
    expect(result.colors["editor.foreground"]).toBe("#d4d4d4");
    expect(result.tokenColors).toHaveLength(1);
    expect(result.tokenColors[0].scope).toBe("keyword");
    expect(result.tokenColors[0].settings.foreground).toBe("#569cd6");
  });

  it("should handle multiple token properties", () => {
    const manifest = createManifest({
      tokens: {
        keyword: {
          foreground: "#ff7b72",
          fontStyle: "bold",
          fontWeight: "700",
        },
      },
    });

    const result = exportVSCode(manifest);
    const tokenColor = result.tokenColors[0];

    expect(tokenColor.settings.foreground).toBe("#ff7b72");
    expect(tokenColor.settings.fontStyle).toBe("bold");
    expect(tokenColor.settings.fontWeight).toBe("700");
  });

  it("should include opacity property when present", () => {
    const manifest = createManifest({
      tokens: {
        comment: {
          foreground: "#6a9955",
          opacity: 0.75,
        },
      },
    });

    const result = exportVSCode(manifest);

    expect(result.tokenColors[0].settings.opacity).toBe(0.75);
  });

  it("should handle empty manifest", () => {
    const manifest = createManifest({});

    const result = exportVSCode(manifest);

    expect(result.name).toBe("Test Theme");
    expect(result.colors).toEqual({});
    expect(result.tokenColors).toEqual([]);
  });

  it("should export valid JSON", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
      },
    });

    const result = exportVSCode(manifest);
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("tokenColors");
    expect(json).toContain("keyword");
  });
});

describe("Notepad++ Exporter", () => {
  it("should export XML structure", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
    });

    const result = exportNotepadPlus(manifest);

    expect(result).toContain("<?xml version");
    expect(result).toContain("<NotepadPlus>");
    expect(result).toContain("</NotepadPlus>");
    expect(result).toContain("UserLang");
    expect(result).toContain(manifest.name);
  });

  it("should convert hex colors to Notepad++ format (BGR)", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#ff0000", // red
        "editor.foreground": "#000000",
      },
      tokens: {
        keyword: {
          foreground: "#ff0000",
        },
      },
    });

    const result = exportNotepadPlus(manifest);

    // BGR format: #ff0000 (red) -> 0000ff (BGR)
    expect(result).toContain("0000ff");
  });

  it("should handle font styles", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
      tokens: {
        keyword: {
          foreground: "#000000",
          fontStyle: "bold italic underline",
        },
        string: {
          foreground: "#000000",
          fontStyle: "italic",
        },
      },
    });

    const result = exportNotepadPlus(manifest);

    // bold=1, italic=2, underline=4 -> 1+2+4 = 7
    expect(result).toContain('fontStyle="7"');
    // italic=2
    expect(result).toContain('fontStyle="2"');
  });

  it("should escape XML special characters", () => {
    const manifest = createManifest({
      name: 'Test <Theme> "Name" & More',
    });

    const result = exportNotepadPlus(manifest);

    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
    expect(result).toContain("&quot;");
    expect(result).toContain("&amp;");
  });

  it("should be valid XML", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
      tokens: {
        keyword: {
          foreground: "#ff0000",
        },
      },
    });

    const result = exportNotepadPlus(manifest);

    // Check for valid XML structure
    expect(result).toMatch(/<NotepadPlus>[\s\S]*<\/NotepadPlus>/);
    expect(result).toMatch(/<UserLang[\s\S]*<\/UserLang>/);
    expect(result).toMatch(/<Styles>[\s\S]*<\/Styles>/);
  });
});

describe("Zed Exporter", () => {
  it("should export theme with appearance detection", () => {
    const darkManifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
    });

    const result = exportZed(darkManifest);

    expect(result.name).toBe("Test Theme");
    expect(result.appearance).toBe("dark");
    expect(result.colors["editor.background"]).toBe("#1e1e1e");
    expect(result.colors["editor.foreground"]).toBe("#d4d4d4");
  });

  it("should detect light appearance", () => {
    const lightManifest = createManifest({
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
    });

    const result = exportZed(lightManifest);

    expect(result.appearance).toBe("light");
  });

  it("should convert fontStyle to Zed format (snake_case)", () => {
    const manifest = createManifest({
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontStyle: "bold italic",
        },
        string: {
          foreground: "#ce9178",
          fontStyle: "underline",
        },
      },
    });

    const result = exportZed(manifest);

    const keywordToken = result.token_colors.find(t => t.scope === "keyword");
    expect(keywordToken?.settings.font_style).toBe("bold italic");

    const stringToken = result.token_colors.find(t => t.scope === "string");
    expect(stringToken?.settings.font_style).toBe("underline");
  });

  it("should include opacity property", () => {
    const manifest = createManifest({
      tokens: {
        comment: {
          foreground: "#6a9955",
          opacity: 0.75,
        },
      },
    });

    const result = exportZed(manifest);
    const commentToken = result.token_colors[0];

    expect(commentToken.settings.opacity).toBe(0.75);
  });

  it("should export valid JSON", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
      },
    });

    const result = exportZed(manifest);
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("token_colors");
    expect(json).toContain("appearance");
  });

  it("should handle tokens without fontStyle", () => {
    const manifest = createManifest({
      tokens: {
        number: {
          foreground: "#b5cea8",
        },
      },
    });

    const result = exportZed(manifest);
    const numberToken = result.token_colors[0];

    expect(numberToken.settings.font_style).toBeUndefined();
    expect(numberToken.settings.foreground).toBe("#b5cea8");
  });
});

describe("Exporter Integration", () => {
  it("should handle a complete manifest across all platforms", () => {
    const manifest = createManifest({
      name: "Complete Theme",
      description: "A complete test theme",
      author: "Test Author",
      version: "1.0.0",
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineNumberForeground": "#858585",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontStyle: "bold",
        },
        string: {
          foreground: "#ce9178",
        },
        comment: {
          foreground: "#6a9955",
          fontStyle: "italic",
        },
        number: {
          foreground: "#b5cea8",
        },
      },
    });

    const vscode = exportVSCode(manifest);
    const notepadPlus = exportNotepadPlus(manifest);
    const zed = exportZed(manifest);

    // All should successfully generate
    expect(vscode.name).toBe("Complete Theme");
    expect(notepadPlus).toContain("Complete Theme");
    expect(zed.name).toBe("Complete Theme");

    // All should be serializable
    expect(() => JSON.stringify(vscode)).not.toThrow();
    expect(() => JSON.stringify(zed)).not.toThrow();
    expect(() => notepadPlus).not.toThrow();
  });
});

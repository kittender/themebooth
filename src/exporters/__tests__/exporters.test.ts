import { exportVSCode } from "../vscode";
import { exportNotepadPlus } from "../notepad-plus";
import { exportZed } from "../zed";
import { exportBrackets } from "../brackets";
import { exportSublime } from "../sublime";
import { exportVim } from "../vim";
import { exportAtom } from "../atom";
import { exportHighlightJs } from "../highlight-js";
import { Manifest } from "../../core/manifest";
import { EditorOverlay } from "../../core/overlay";

const createManifest = (partial: Partial<Manifest>): Manifest => ({
  name: "Test Theme",
  author: "Test Author",
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

const createOverlay = (partial: Partial<EditorOverlay>): EditorOverlay => ({
  inherits: "./manifest.json",
  colors: {},
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

describe("Brackets Exporter", () => {
  it("should generate LESS output with comment header", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      variables: {
        "color-bg": "#1e1e1e",
        "color-fg": "#d4d4d4",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontStyle: "bold",
        },
      },
    });
    const overlay = createOverlay({});

    const result = exportBrackets(manifest, overlay);

    expect(result).toContain("Generated Brackets/CodeMirror Theme");
    expect(result).toContain(".cm-s-themebooth");
  });

  it("should include variable declarations from manifest", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
      },
      variables: {
        "color-bg-primary": "#1e1e1e",
        "color-fg-primary": "#d4d4d4",
        "color-semantic-keyword": "#569cd6",
      },
      tokens: {},
    });
    const overlay = createOverlay({});

    const result = exportBrackets(manifest, overlay);

    expect(result).toContain("@color-bg-primary: #1e1e1e;");
    expect(result).toContain("@color-fg-primary: #d4d4d4;");
    expect(result).toContain("@color-semantic-keyword: #569cd6;");
  });

  it("should include custom LESS selectors from overlay", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
      tokens: {},
    });
    const overlay = createOverlay({
      less: {
        ".cm-m-xml .cm-tag": {
          color: "#569cd6",
        },
        ".cm-m-css .cm-property": {
          color: "#9cdcfe",
        },
      },
    });

    const result = exportBrackets(manifest, overlay);

    expect(result).toContain(".cm-s-themebooth .cm-m-xml .cm-tag");
    expect(result).toContain("color: #569cd6");
    expect(result).toContain(".cm-s-themebooth .cm-m-css .cm-property");
    expect(result).toContain("color: #9cdcfe");
  });

  it("should generate CodeMirror token styles from manifest tokens", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
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
      },
    });
    const overlay = createOverlay({});

    const result = exportBrackets(manifest, overlay);

    expect(result).toContain(".cm-s-themebooth .cm-keyword");
    expect(result).toContain("color: #569cd6");
    expect(result).toContain("font-style: bold");
    expect(result).toContain(".cm-s-themebooth .cm-string");
    expect(result).toContain(".cm-s-themebooth .cm-comment");
  });

  it("should include decorative elements as comments", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
      tokens: {},
    });
    const overlay = createOverlay({
      decorativeElements: {
        activeLineSparkle: "✨",
        errorIcon: "☠",
      },
    });

    const result = exportBrackets(manifest, overlay);

    expect(result).toContain("Decorative Elements");
    expect(result).toContain("activeLineSparkle: ✨");
    expect(result).toContain("errorIcon: ☠");
  });

  it("should include visual effects as comments", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
      tokens: {},
    });
    const overlay = createOverlay({
      visualEffects: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        lineHighlightOpacity: 0.1,
      },
    });

    const result = exportBrackets(manifest, overlay);

    expect(result).toContain("Visual Effects");
    expect(result).toContain("boxShadow");
    expect(result).toContain("0 2px 8px rgba(0,0,0,0.3)");
  });

  it("should output valid LESS syntax", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
      variables: { "color-bg": "#1e1e1e" },
      tokens: {
        keyword: { foreground: "#569cd6" },
      },
    });
    const overlay = createOverlay({
      less: {
        ".cm-keyword": { color: "#569cd6" },
      },
    });

    const result = exportBrackets(manifest, overlay);

    // Check for LESS syntax patterns
    expect(result).toContain("@");
    expect(result).toContain(":");
    expect(result).toContain(";");
    expect(result).toContain("{");
    expect(result).toContain("}");
  });

  it("should handle empty overlay", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
      tokens: {},
      variables: {},
    });
    const overlay = createOverlay({});

    const result = exportBrackets(manifest, overlay);

    expect(result).toBeTruthy();
    expect(result).toContain(".cm-s-themebooth");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("Sublime Exporter", () => {
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
    const overlay = createOverlay({});

    const result = exportSublime(manifest, overlay);

    expect(result.name).toBe("Test Theme");
    expect(result.author).toBe("Test Author");
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].scope).toBe("keyword");
    expect(result.rules[0].foreground).toBe("#569cd6");
  });

  it("should apply token overrides from overlay", () => {
    const manifest = createManifest({
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
      },
    });
    const overlay = createOverlay({
      tokenOverrides: {
        keyword: {
          foreground: "#ff0000",
          fontStyle: "bold",
        },
      },
    });

    const result = exportSublime(manifest, overlay);

    const keywordRule = result.rules.find((r) => r.scope === "keyword");
    expect(keywordRule?.foreground).toBe("#ff0000");
    expect(keywordRule?.fontStyle).toBe("bold");
  });

  it("should build Sublime globals from manifest colors", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.cursorColor": "#aeafad",
      },
    });
    const overlay = createOverlay({});

    const result = exportSublime(manifest, overlay);

    expect(result.globals.background).toBe("#1e1e1e");
    expect(result.globals.foreground).toBe("#d4d4d4");
    expect(result.globals.caret).toBe("#aeafad");
  });

  it("should serialize to valid JSON", () => {
    const manifest = createManifest({
      tokens: {
        keyword: { foreground: "#569cd6" },
      },
    });
    const overlay = createOverlay({});

    const result = exportSublime(manifest, overlay);
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("rules");
    expect(json).toContain("keyword");
  });
});

describe("Vim Exporter", () => {
  it("should generate vim color scheme script", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontStyle: "bold",
        },
      },
    });
    const overlay = createOverlay({});

    const result = exportVim(manifest, overlay);

    expect(result).toContain("Generated Vim Color Scheme");
    expect(result).toContain(`let colors_name = "${manifest.name}"`);
    expect(result).toContain("hi Normal");
    expect(result).toContain("#1e1e1e");
    expect(result).toContain("#d4d4d4");
  });

  it("should apply token overrides from overlay", () => {
    const manifest = createManifest({
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
      },
    });
    const overlay = createOverlay({
      tokenOverrides: {
        keyword: {
          foreground: "#ff0000",
          fontStyle: "bold italic",
        },
      },
    });

    const result = exportVim(manifest, overlay);

    expect(result).toContain("Token Overrides");
    expect(result).toContain("#ff0000");
    expect(result).toContain("bold");
    expect(result).toContain("italic");
  });

  it("should output valid vim script syntax", () => {
    const manifest = createManifest({
      colors: { "editor.background": "#1e1e1e" },
      tokens: {
        keyword: { foreground: "#569cd6" },
        string: { foreground: "#ce9178" },
      },
    });
    const overlay = createOverlay({});

    const result = exportVim(manifest, overlay);

    expect(result).toContain("set background=");
    expect(result).toContain("hi clear");
    expect(result).toContain("syntax reset");
    expect(result).toContain("hi Keyword");
    expect(result).toContain("hi String");
  });
});

describe("Atom Exporter", () => {
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
    const overlay = createOverlay({});

    const result = exportAtom(manifest, overlay);

    expect(result.name).toBe("Test Theme");
    expect(result.author).toBe("Test Author");
    expect(result.version).toBe("1.0.0");
    expect(result.tokenColors).toHaveLength(1);
    expect(result.tokenColors[0].scope).toBe("keyword");
    expect(result.tokenColors[0].settings.foreground).toBe("#569cd6");
  });

  it("should apply token overrides from overlay", () => {
    const manifest = createManifest({
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
      },
    });
    const overlay = createOverlay({
      tokenOverrides: {
        keyword: {
          foreground: "#ff0000",
          background: "#000000",
        },
      },
    });

    const result = exportAtom(manifest, overlay);

    const keywordToken = result.tokenColors.find((t) => t.scope === "keyword");
    expect(keywordToken?.settings.foreground).toBe("#ff0000");
    expect(keywordToken?.settings.background).toBe("#000000");
  });

  it("should map editor colors to Atom-specific keys", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.cursorColor": "#aeafad",
      },
    });
    const overlay = createOverlay({});

    const result = exportAtom(manifest, overlay);

    expect(result.colors["editor.backgroundColor"]).toBe("#1e1e1e");
    expect(result.colors["editor.textColor"]).toBe("#d4d4d4");
    expect(result.colors["editor.cursorColor"]).toBe("#aeafad");
  });

  it("should serialize to valid JSON", () => {
    const manifest = createManifest({
      tokens: {
        keyword: { foreground: "#569cd6" },
      },
    });
    const overlay = createOverlay({});

    const result = exportAtom(manifest, overlay);
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("tokenColors");
    expect(json).toContain("keyword");
  });
});

describe("Highlight.js Exporter", () => {
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

    const result = exportHighlightJs(manifest);

    expect(result["hljs"]).toBe("#d4d4d4");
    expect(result["hljs-background"]).toBe("#1e1e1e");
    expect(result["hljs-keyword"]).toBe("#569cd6");
  });

  it("should map common token scopes to Highlight.js classes", () => {
    const manifest = createManifest({
      tokens: {
        "string": {
          foreground: "#ce9178",
        },
        "comment": {
          foreground: "#6a9955",
        },
        "number": {
          foreground: "#b5cea8",
        },
        "variable.builtin": {
          foreground: "#9cdcfe",
        },
      },
    });

    const result = exportHighlightJs(manifest);

    expect(result["hljs-string"]).toBe("#ce9178");
    expect(result["hljs-comment"]).toBe("#6a9955");
    expect(result["hljs-number"]).toBe("#b5cea8");
    expect(result["hljs-built_in"]).toBe("#9cdcfe");
  });

  it("should map complex scopes with prefixes", () => {
    const manifest = createManifest({
      tokens: {
        "entity.name.function": {
          foreground: "#dcdcaa",
        },
        "punctuation.definition.string": {
          foreground: "#ce9178",
        },
      },
    });

    const result = exportHighlightJs(manifest);

    expect(result["hljs-title"]).toBe("#dcdcaa");
    expect(result["hljs-function"]).toBe("#dcdcaa");
    expect(result["hljs-string"]).toBe("#ce9178");
  });

  it("should use fallback category mapping for unknown scopes", () => {
    const manifest = createManifest({
      tokens: {
        "constant.something": {
          foreground: "#4ec9b0",
        },
      },
    });

    const result = exportHighlightJs(manifest);

    expect(result["hljs-literal"]).toBe("#4ec9b0");
  });

  it("should assign default class for unmatched scopes", () => {
    const manifest = createManifest({
      tokens: {
        "unknown.scope": {
          foreground: "#aabbcc",
        },
      },
    });

    const result = exportHighlightJs(manifest);

    expect(result["hljs-attr"]).toBe("#aabbcc");
  });

  it("should handle empty manifest", () => {
    const manifest = createManifest({});

    const result = exportHighlightJs(manifest);

    expect(result["hljs"]).toBeDefined();
    expect(result["hljs-background"]).toBeDefined();
  });

  it("should export valid JSON", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
      tokens: {
        keyword: {
          foreground: "#569cd6",
        },
        string: {
          foreground: "#ce9178",
        },
      },
    });

    const result = exportHighlightJs(manifest);
    const json = JSON.stringify(result);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("hljs");
    expect(json).toContain("#569cd6");
  });

  it("should use default foreground when no editor.foreground color", () => {
    const manifest = createManifest({
      colors: {
        "editor.background": "#1e1e1e",
      },
    });

    const result = exportHighlightJs(manifest);

    expect(result["hljs"]).toBe("#000000");
    expect(result["hljs-background"]).toBe("#1e1e1e");
  });

  it("should use default background when no editor.background color", () => {
    const manifest = createManifest({
      colors: {
        "editor.foreground": "#d4d4d4",
      },
    });

    const result = exportHighlightJs(manifest);

    expect(result["hljs"]).toBe("#d4d4d4");
    expect(result["hljs-background"]).toBe("#ffffff");
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
    const overlay = createOverlay({});

    const vscode = exportVSCode(manifest);
    const notepadPlus = exportNotepadPlus(manifest);
    const zed = exportZed(manifest);
    const sublime = exportSublime(manifest, overlay);
    const vim = exportVim(manifest, overlay);
    const atom = exportAtom(manifest, overlay);
    const highlightJs = exportHighlightJs(manifest);

    // All should successfully generate
    expect(vscode.name).toBe("Complete Theme");
    expect(notepadPlus).toContain("Complete Theme");
    expect(zed.name).toBe("Complete Theme");
    expect(sublime.name).toBe("Complete Theme");
    expect(vim).toContain("Complete Theme");
    expect(atom.name).toBe("Complete Theme");
    expect(highlightJs["hljs"]).toBeDefined();

    // All should be serializable
    expect(() => JSON.stringify(vscode)).not.toThrow();
    expect(() => JSON.stringify(zed)).not.toThrow();
    expect(() => JSON.stringify(sublime)).not.toThrow();
    expect(() => JSON.stringify(atom)).not.toThrow();
    expect(() => JSON.stringify(highlightJs)).not.toThrow();
    expect(() => vim).not.toThrow();
  });
});

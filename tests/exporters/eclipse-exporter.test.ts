import { describe, it, expect } from "vitest";
import { exportEclipse } from "../../src/exporters/eclipse";
import type { Manifest } from "../../src/core/manifest";

const mockManifest: Manifest = {
  name: "test-theme",
  displayName: "Test Theme",
  version: "1.0.0",
  description: "A test theme",
  author: "Test Author",
  variables: {},
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editorLineNumber.foreground": "#858585",
    "editor.selectionBackground": "#264f78",
    "editor.lineHighlightBackground": "#f7ebc6",
  },
  tokens: {
    keyword: {
      foreground: "#569cd6",
      fontStyle: "bold",
    },
    string: {
      foreground: "#ce9178",
    },
    "comment.line": {
      foreground: "#6a9955",
      fontStyle: "italic",
    },
    "comment.block": {
      foreground: "#6a9955",
    },
    number: {
      foreground: "#b5cea8",
    },
    function: {
      foreground: "#dcdcaa",
    },
    variable: {
      foreground: "#9cdcfe",
    },
    type: {
      foreground: "#4ec9b0",
    },
    annotation: {
      foreground: "#ca9149",
    },
    constant: {
      foreground: "#9cdcfe",
    },
    operator: {
      foreground: "#d4d4d4",
    },
  },
  semanticTokens: {},
  languageTokens: {},
  presets: {},
};

describe("Eclipse Exporter", () => {
  it("should export all required files", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.colorThemeXml).toBeDefined();
    expect(result.pluginXml).toBeDefined();
    expect(result.manifestMf).toBeDefined();
    expect(result.pluginProperties).toBeDefined();
    expect(result.epfContent).toBeDefined();
  });

  it("should generate valid XML for color theme", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.colorThemeXml).toContain("<?xml version");
    expect(result.colorThemeXml).toContain("<colorTheme");
    expect(result.colorThemeXml).toContain("</colorTheme>");
    expect(result.colorThemeXml).toContain('id="com.themebooth.test-theme"');
  });

  it("should include keyword color in XML", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.colorThemeXml).toContain("<keyword");
    expect(result.colorThemeXml).toContain("569cd6");
    expect(result.colorThemeXml).toContain('bold="true"');
  });

  it("should include string color in XML", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.colorThemeXml).toContain("<string");
    expect(result.colorThemeXml).toContain("ce9178");
  });

  it("should map background and foreground colors", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.colorThemeXml).toContain('<background color="#1e1e1e"');
    expect(result.colorThemeXml).toContain('<foreground color="#d4d4d4"');
  });

  it("should generate plugin.xml with correct extension point", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.pluginXml).toContain("<?xml version");
    expect(result.pluginXml).toContain("org.eclipse.colorTheme.theme");
    expect(result.pluginXml).toContain("colors/test-theme.eclipse-color-theme.xml");
  });

  it("should generate valid MANIFEST.MF", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.manifestMf).toContain("Manifest-Version: 1.0");
    expect(result.manifestMf).toContain("Bundle-ManifestVersion: 2");
    expect(result.manifestMf).toContain("Bundle-Name: test-theme Theme");
    expect(result.manifestMf).toContain("Bundle-SymbolicName: com.themebooth.test-theme");
    expect(result.manifestMf).toContain("Bundle-Version: 1.0.0");
    expect(result.manifestMf).toContain("Require-Bundle:");
  });

  it("should generate plugin.properties", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.pluginProperties).toContain("pluginName=test-theme Theme");
    expect(result.pluginProperties).toContain("providerName=Test Author");
  });

  it("should generate valid EPF format", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.epfContent).toContain("# Eclipse");
    expect(result.epfContent).toContain("/instance/org.eclipse.jdt.ui/");
    expect(result.epfContent).toContain("syntaxColor.java_keyword");
  });

  it("should escape XML special characters", () => {
    const manifestWithSpecialChars: Manifest = {
      ...mockManifest,
      name: "test<theme>",
      author: "Test & Author",
    };

    const result = exportEclipse(manifestWithSpecialChars, null);

    expect(result.colorThemeXml).toContain("&lt;");
    expect(result.colorThemeXml).toContain("&gt;");
    expect(result.colorThemeXml).toContain("&amp;");
  });

  it("should handle missing author gracefully", () => {
    const manifestNoAuthor: Manifest = {
      ...mockManifest,
      author: undefined,
    };

    const result = exportEclipse(manifestNoAuthor, null);

    expect(result.pluginProperties).toContain("providerName=ThemeBooth");
    expect(result.manifestMf).toContain("Bundle-Vendor: ThemeBooth");
  });

  it("should handle sparse manifest with missing tokens", () => {
    const sparseManifest: Manifest = {
      name: "sparse-theme",
      displayName: "Sparse Theme",
      version: "1.0.0",
      description: "",
      author: "Test",
      variables: {},
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
      },
      tokens: {
        keyword: {
          foreground: "#0000ff",
        },
      },
      semanticTokens: {},
      languageTokens: {},
      presets: {},
    };

    const result = exportEclipse(sparseManifest, null);

    expect(result.colorThemeXml).toBeDefined();
    expect(result.pluginXml).toBeDefined();
    expect(result.manifestMf).toBeDefined();
  });

  it("should include comment colors as singleLineComment and multiLineComment", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.colorThemeXml).toContain("<singleLineComment");
    expect(result.colorThemeXml).toContain("<multiLineComment");
  });

  it("should include italic style in EPF", () => {
    const result = exportEclipse(mockManifest, null);

    expect(result.epfContent).toContain("syntaxColor.java_single_line_comment");
    expect(result.epfContent).toContain("italic");
  });

  it("should handle overlay token overrides", () => {
    const overlay = {
      inherits: "",
      tokenOverrides: {
        keyword: {
          foreground: "#ff0000",
          fontStyle: "italic",
        },
      },
    };

    const result = exportEclipse(mockManifest, overlay);

    expect(result.colorThemeXml).toContain("<keyword");
    expect(result.colorThemeXml).toContain("ff0000");
  });
});

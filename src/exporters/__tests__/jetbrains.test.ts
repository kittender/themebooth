import { exportIntelliJ, serializeIclsXml, generatePluginXml, buildPluginMetadata } from "../jetbrains";
import { Manifest } from "../../core/manifest";
import { EditorOverlay } from "../../core/overlay";

const createManifest = (partial: Partial<Manifest> = {}): Manifest => ({
  name: "Test Theme",
  author: "Test Author",
  version: "1.0.0",
  description: "Test theme description",
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

describe("JetBrains Exporter", () => {
  describe("exportIntelliJ", () => {
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

      const result = exportIntelliJ(manifest, null);

      expect(result.name).toBe("Test Theme");
      expect(result.version).toBe("142");
      expect(result.parentScheme).toBe("Default");
      expect(result.options.length).toBeGreaterThan(0);
      expect(result.attributesGroups.length).toBeGreaterThan(0);
    });

    it("should map editor colors to JetBrains options", () => {
      const manifest = createManifest({
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#d4d4d4",
          "editor.lineNumbers": "#858585",
          "editor.cursor": "#d4d4d4",
        },
      });

      const result = exportIntelliJ(manifest, null);

      const backgroundOption = result.options.find((o) => o.name === "BACKGROUND");
      expect(backgroundOption?.value).toBe("1e1e1e");

      const foregroundOption = result.options.find((o) => o.name === "FOREGROUND");
      expect(foregroundOption?.value).toBe("d4d4d4");
    });

    it("should map token scopes to semantic attributes", () => {
      const manifest = createManifest({
        tokens: {
          keyword: {
            foreground: "#569cd6",
            fontStyle: "bold",
          },
          string: {
            foreground: "#ce9178",
          },
        },
      });

      const result = exportIntelliJ(manifest, null);

      expect(result.attributesGroups.length).toBeGreaterThan(0);
      const attributes = result.attributesGroups.flatMap((g) => g.attributes);
      expect(attributes.some((a) => a.name === "KEYWORD")).toBe(true);
      expect(attributes.some((a) => a.name === "STRING")).toBe(true);
    });

    it("should handle overlay color merging", () => {
      const manifest = createManifest({
        colors: {
          "editor.background": "#000000",
          "editor.foreground": "#ffffff",
        },
      });

      const overlay = createOverlay({
        colors: {
          "editor.background": "#1e1e1e",
        },
      });

      const result = exportIntelliJ(manifest, overlay);

      const backgroundOption = result.options.find((o) => o.name === "BACKGROUND");
      expect(backgroundOption?.value).toBe("1e1e1e");
    });

    it("should skip tokens without any styling", () => {
      const manifest = createManifest({
        tokens: {
          keyword: {
            foreground: "#569cd6",
          },
          emptyToken: {},
        },
      });

      const result = exportIntelliJ(manifest, null);
      const attributes = result.attributesGroups.flatMap((g) => g.attributes);

      expect(attributes.some((a) => a.name === "KEYWORD")).toBe(true);
    });
  });

  describe("serializeIclsXml", () => {
    it("should generate valid XML structure", () => {
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

      const colorScheme = exportIntelliJ(manifest, null);
      const xml = serializeIclsXml(colorScheme);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain(`<scheme name="${manifest.name}" version="142"`);
      expect(xml).toContain("<attributes>");
      expect(xml).toContain("</scheme>");
    });

    it("should escape XML special characters", () => {
      const manifest = createManifest({
        name: 'Test & "Theme"',
        colors: {},
        tokens: {},
      });

      const colorScheme = exportIntelliJ(manifest, null);
      const xml = serializeIclsXml(colorScheme);

      expect(xml).toContain(`&quot;Theme&quot;`);
      expect(xml).toContain("&amp;");
    });

    it("should include color options in XML", () => {
      const manifest = createManifest({
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#d4d4d4",
        },
        tokens: {},
      });

      const colorScheme = exportIntelliJ(manifest, null);
      const xml = serializeIclsXml(colorScheme);

      expect(xml).toContain('name="BACKGROUND"');
      expect(xml).toContain('value="1e1e1e"');
      expect(xml).toContain('name="FOREGROUND"');
      expect(xml).toContain('value="d4d4d4"');
    });
  });

  describe("generatePluginXml", () => {
    it("should generate valid plugin.xml structure", () => {
      const manifest = createManifest({
        description: "A dark theme",
      });

      const metadata = buildPluginMetadata(manifest);
      const xml = generatePluginXml(metadata, "TestTheme.icls");

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<idea-plugin>");
      expect(xml).toContain("</idea-plugin>");
      expect(xml).toContain(`<id>${metadata.id}</id>`);
      expect(xml).toContain(`<name>${manifest.name}</name>`);
      expect(xml).toContain(`<version>${manifest.version}</version>`);
    });

    it("should include theme provider extension", () => {
      const manifest = createManifest();
      const metadata = buildPluginMetadata(manifest);
      const xml = generatePluginXml(metadata, "MyTheme.icls");

      expect(xml).toContain('<extensions defaultExtensionNs="com.intellij">');
      expect(xml).toContain('<themeProvider path="/theme/MyTheme.icls" />');
    });

    it("should include IDE version info", () => {
      const manifest = createManifest();
      const metadata = buildPluginMetadata(manifest);
      const xml = generatePluginXml(metadata, "theme.icls");

      expect(xml).toContain('since-build="211.0"');
    });
  });

  describe("buildPluginMetadata", () => {
    it("should generate correct plugin ID from theme name", () => {
      const manifest = createManifest({
        name: "My Dark Theme",
      });

      const metadata = buildPluginMetadata(manifest);

      expect(metadata.id).toContain("com.themebooth.");
      expect(metadata.id).toContain("my-dark-theme");
    });

    it("should use manifest version", () => {
      const manifest = createManifest({
        version: "2.5.1",
      });

      const metadata = buildPluginMetadata(manifest);

      expect(metadata.version).toBe("2.5.1");
    });

    it("should use theme description or fallback", () => {
      const manifest = createManifest({
        name: "Test",
        description: "A great theme",
      });

      const metadata = buildPluginMetadata(manifest);

      expect(metadata.description).toBe("A great theme");
    });

    it("should fallback to generic description if empty", () => {
      const manifest = createManifest({
        name: "Test",
        description: "",
      });

      const metadata = buildPluginMetadata(manifest);

      expect(metadata.description).toContain("color scheme");
    });

    it("should include author name in change notes", () => {
      const manifest = createManifest({
        author: "John Doe",
        version: "1.0.0",
      });

      const metadata = buildPluginMetadata(manifest);

      expect(metadata.changeNotes).toContain("John Doe");
      expect(metadata.changeNotes).toContain("1.0.0");
    });
  });

  describe("Font style handling", () => {
    it("should encode bold font style", () => {
      const manifest = createManifest({
        tokens: {
          keyword: {
            foreground: "#569cd6",
            fontStyle: "bold",
          },
        },
      });

      const colorScheme = exportIntelliJ(manifest, null);
      const xml = serializeIclsXml(colorScheme);

      expect(xml).toContain("fontStyle");
      expect(xml).toContain("1");
    });

    it("should encode italic font style", () => {
      const manifest = createManifest({
        tokens: {
          comment: {
            foreground: "#6a9955",
            fontStyle: "italic",
          },
        },
      });

      const colorScheme = exportIntelliJ(manifest, null);
      const xml = serializeIclsXml(colorScheme);

      expect(xml).toContain("fontStyle");
      expect(xml).toContain("2");
    });
  });

  describe("Color format conversion", () => {
    it("should convert #RRGGBB to RRGGBB hex", () => {
      const manifest = createManifest({
        colors: {
          "editor.background": "#1e1e1e",
        },
        tokens: {
          keyword: {
            foreground: "#FF00FF",
          },
        },
      });

      const colorScheme = exportIntelliJ(manifest, null);
      const xml = serializeIclsXml(colorScheme);

      expect(xml).toContain("1e1e1e");
      expect(xml).toContain("ff00ff");
      expect(xml).not.toContain("#");
    });
  });
});

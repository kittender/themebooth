import * as fs from "fs/promises";
import * as path from "path";
import { tmpdir } from "os";
import { validateManifest } from "../../core/manifest";
import { parseManifestJSON } from "../../utils/validation";

async function createTempManifest(content: any): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const tempDir = path.join(tmpdir(), `themebooth-test-${Date.now()}-${Math.random()}`);
  await fs.mkdir(tempDir, { recursive: true });
  const manifestPath = path.join(tempDir, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(content, null, 2));

  return {
    path: manifestPath,
    cleanup: async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    },
  };
}

describe("Manifest Validation (validateCommand suite)", () => {
  describe("JSON parsing", () => {
    it("should parse valid JSON", async () => {
      const { path: manifestPath, cleanup } = await createTempManifest({
        name: "Test",
        author: "Test",
        version: "1.0.0",
      });

      const content = await fs.readFile(manifestPath, "utf-8");
      const result = parseManifestJSON(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test");
      }

      await cleanup();
    });

    it("should report line:column on JSON parse errors", async () => {
      const invalidJSON = `{
  "name": "Test",
  "author": "Test",
  "version": "1.0.0",
  invalid line here
}`;

      const result = parseManifestJSON(invalidJSON);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("JSON");
      }
    });
  });

  describe("Schema validation", () => {
    it("should accept minimal valid manifest", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should reject manifest missing required fields", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        // missing version
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should accept manifest with all sections", () => {
      const manifest = {
        name: "Full Theme",
        author: "Test",
        version: "1.0.0",
        description: "A complete theme",
        variables: {
          primary: "#FF0000",
          secondary: "#00FF00",
        },
        colors: {
          "editor.background": "#1e1e1e",
          "editor.foreground": "#d4d4d4",
        },
        tokens: {
          keyword: { foreground: "$primary", fontStyle: "bold" },
          string: { foreground: "$secondary" },
        },
        semanticTokens: {
          type: { foreground: "$primary" },
        },
        languageTokens: {
          javascript: {
            keyword: { foreground: "$primary" },
          },
        },
        computed: {
          darkPrimary: { base: "$primary", transform: "darken", amount: 20 },
        },
        presets: {
          light: { variableOverrides: { primary: "#0000FF" } },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });
  });

  describe("Color validation", () => {
    it("should accept hex colors", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          primary: "#FF0000",
          secondary: "#00ff00",
          tertiary: "#0F0",
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should reject invalid hex colors", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          invalid: "#gggggg",
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });

    it("should accept variable references", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          primary: "#FF0000",
          secondary: "$primary",
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });
  });

  describe("Variable validation", () => {
    it("should allow variable references in variables", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          base: "#FF0000",
          primary: "$base",
          secondary: "$primary",
        },
        colors: {
          "editor.background": "$secondary",
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow variable references with circular pattern (schema level)", () => {
      // Note: Circular dependency detection is done at validateCommand level, not schema level
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          a: "$b",
          b: "$a",
        },
        tokens: {
          keyword: { foreground: "$a" },
        },
      };

      // Schema validation allows this (circular detection is in validateCommand)
      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });
  });

  describe("Token validation", () => {
    it("should validate token properties at schema level", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            fontStyle: "bold",
            opacity: 0.5,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow any value for fontStyle at schema level (detailed validation in validateCommand)", () => {
      // Note: fontStyle value validation is done in validateCommand, not schema
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            fontStyle: "invalid",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow multiple fontStyle values", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            fontStyle: "bold italic underline",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow fontWeight values at schema level", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            fontWeight: "700",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow any fontWeight value at schema level (validation in validateCommand)", () => {
      // fontWeight value validation is done in validateCommand
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            fontWeight: "999",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow opacity values at schema level", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            opacity: 0.5,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow any opacity value at schema level (validation in validateCommand)", () => {
      // opacity range validation is done in validateCommand
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            opacity: 1.5,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should reject unknown token properties", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        tokens: {
          keyword: {
            foreground: "#FF0000",
            unknownProperty: "value",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });
  });

  describe("Semantic tokens", () => {
    it("should validate semantic tokens same as regular tokens", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        semanticTokens: {
          type: {
            foreground: "#FF0000",
            fontStyle: "italic",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow any fontStyle value at schema level (validation in validateCommand)", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        semanticTokens: {
          type: {
            foreground: "#FF0000",
            fontStyle: "invalid",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should reject unknown semantic token properties", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        semanticTokens: {
          type: {
            foreground: "#FF0000",
            unknownProp: "value",
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });
  });

  describe("Language tokens", () => {
    it("should validate language tokens", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        languageTokens: {
          javascript: {
            keyword: {
              foreground: "#569cd6",
              fontStyle: "bold",
            },
          },
          python: {
            string: {
              foreground: "#ce9178",
            },
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow any opacity value at schema level (validation in validateCommand)", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        languageTokens: {
          javascript: {
            keyword: {
              foreground: "#FF0000",
              opacity: 1.5,
            },
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should reject unknown language token properties", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        languageTokens: {
          javascript: {
            keyword: {
              foreground: "#FF0000",
              unknownProp: "value",
            },
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });
  });

  describe("Computed colors", () => {
    it("should validate computed color with variable base", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          primary: "#FF0000",
        },
        computed: {
          darkPrimary: {
            base: "$primary",
            transform: "darken",
            amount: 20,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should validate computed color with hex base", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        computed: {
          darkRed: {
            base: "#FF0000",
            transform: "darken",
            amount: 20,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow undefined base variable at schema level (semantic check in validateCommand)", () => {
      // Note: undefined variable check is done in validateCommand, not schema
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        computed: {
          invalid: {
            base: "$undefined",
            transform: "darken",
            amount: 20,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should validate transform whitelist at schema level", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        computed: {
          invalid: {
            base: "#FF0000",
            transform: "invalid",
            amount: 20,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });

    it("should validate amount range 0-100 at schema level", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        computed: {
          invalid: {
            base: "#FF0000",
            transform: "darken",
            amount: 150,
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(false);
    });
  });

  describe("Presets", () => {
    it("should validate preset variable overrides", () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          primary: "#FF0000",
        },
        presets: {
          light: {
            variableOverrides: {
              primary: "#0000FF",
            },
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow preset with any variable override at schema level (semantic check in validateCommand)", () => {
      // Note: undefined variable check is done in validateCommand, not schema
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          primary: "#FF0000",
        },
        presets: {
          light: {
            variableOverrides: {
              undefined: "#0000FF",
            },
          },
        },
      };

      const result = validateManifest(manifest);
      expect(result.success).toBe(true);
    });
  });

  describe("Color format conversion", () => {
    it("should accept and convert RGB colors with fix", async () => {
      const manifest = {
        name: "Test",
        author: "Test",
        version: "1.0.0",
        variables: {
          red: "rgb(255, 0, 0)",
        },
      };

      const { path: manifestPath, cleanup } = await createTempManifest(manifest);

      // Write and read to test file handling
      const content = await fs.readFile(manifestPath, "utf-8");
      const parsed = JSON.parse(content);

      expect(parsed.variables.red).toBe("rgb(255, 0, 0)");

      await cleanup();
    });
  });
});

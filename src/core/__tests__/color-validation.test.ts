import { validateManifest } from "../manifest";

describe("Color Validation", () => {
  it("should accept valid 6-digit hex colors", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        primary: "#FF0000",
        secondary: "#00ff00",
        tertiary: "#0000FF",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should accept valid 3-digit hex colors", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        primary: "#f00",
        secondary: "#0f0",
        tertiary: "#00f",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should reject invalid hex colors (missing hash)", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        primary: "ff0000",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });

  it("should reject invalid hex colors (wrong length)", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        primary: "#ff",
        secondary: "#ff00",
        tertiary: "#ff00000",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });

  it("should reject invalid hex colors (invalid characters)", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        primary: "#gggggg",
        secondary: "#ff000z",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });

  it("should accept variable references in variables", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        base: "#ff0000",
        derived: "$base",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should accept variable references in colors", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        bg: "#1e1e1e",
      },
      colors: {
        "editor.background": "$bg",
        "editor.foreground": "#ffffff",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should accept variable references in token colors", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        keyword: "#569cd6",
        string: "#ce9178",
      },
      tokens: {
        keyword: {
          foreground: "$keyword",
        },
        string: {
          foreground: "$string",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should reject invalid color formats in colors object", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      colors: {
        "editor.background": "rgb(30, 30, 30)",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });

  it("should reject invalid color formats in tokens", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      tokens: {
        keyword: {
          foreground: "hsl(0, 100%, 50%)",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });

  it("should accept opacity values in tokens", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      tokens: {
        comment: {
          foreground: "#6a9955",
          opacity: 0.75,
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should accept fontStyle in tokens", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontStyle: "bold italic",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should accept fontWeight in tokens", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      tokens: {
        keyword: {
          foreground: "#569cd6",
          fontWeight: "700",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should accept background color in tokens", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      tokens: {
        keyword: {
          foreground: "#569cd6",
          background: "#1a1a1a",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should validate multiple colors in colors object", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineNumberForeground": "#858585",
        "editor.cursorForeground": "#aeafad",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should report color validation errors with field information", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        invalid1: "not-a-color",
        invalid2: "#gg0000",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toContain("variables");
    }
  });

  it("should accept case-insensitive hex colors", () => {
    const manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        upper: "#ABCDEF",
        lower: "#abcdef",
        mixed: "#AbCdEf",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });
});

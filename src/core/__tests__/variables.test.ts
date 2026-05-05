import {
  resolveVariables,
  interpolateManifest,
  validateVariableReferences,
} from "../variables";
import { Manifest } from "../manifest";

const createManifest = (partial: Partial<Manifest>): Manifest => ({
  name: "Test",
  author: "Test",
  version: "1.0.0",
  description: "",
  variables: {},
  colors: {},
  tokens: {},
  presets: [],
  ...partial,
});

describe("Variable Resolution", () => {
  it("should resolve simple variables", () => {
    const manifest = createManifest({
      variables: {
        primary: "#ff0000",
        secondary: "#00ff00",
      },
    });

    const result = resolveVariables(manifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.variables.primary).toBe("#ff0000");
      expect(result.variables.secondary).toBe("#00ff00");
    }
  });

  it("should detect circular references", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        a: "$b",
        b: "$a",
      },
    };

    const result = resolveVariables(manifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.reason).toBe("circular");
      expect(result.error.message).toContain("Circular");
    }
  });

  it("should detect three-way circular references", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        a: "$b",
        b: "$c",
        c: "$a",
      },
    };

    const result = resolveVariables(manifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.reason).toBe("circular");
    }
  });

  it("should resolve transitive variable references", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        base: "#ff0000",
        derived: "$base",
      },
    };

    const result = resolveVariables(manifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.variables.derived).toBe("#ff0000");
    }
  });

  it("should interpolate variables in colors", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        bg: "#0d1117",
        fg: "#c9d1d9",
      },
      colors: {
        "editor.background": "$bg",
        "editor.foreground": "$fg",
      },
    };

    const resResult = resolveVariables(manifest);
    expect(resResult.success).toBe(true);
    if (resResult.success) {
      const interpolated = interpolateManifest(manifest, resResult.variables);
      expect(interpolated.colors?.["editor.background"]).toBe("#0d1117");
      expect(interpolated.colors?.["editor.foreground"]).toBe("#c9d1d9");
    }
  });

  it("should interpolate variables in tokens", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      variables: {
        keyword: "#ff7b72",
      },
      tokens: {
        keyword: {
          foreground: "$keyword",
        },
      },
    };

    const resResult = resolveVariables(manifest);
    expect(resResult.success).toBe(true);
    if (resResult.success) {
      const interpolated = interpolateManifest(manifest, resResult.variables);
      expect(interpolated.tokens?.keyword?.foreground).toBe("#ff7b72");
    }
  });

  it("should validate references to undefined variables", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      colors: {
        "editor.background": "$undefined",
      },
    };

    const errors = validateVariableReferences(manifest);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Undefined");
  });

  it("should find all undefined variable references", () => {
    const manifest: Manifest = {
      name: "Test",
      author: "Test",
      version: "1.0.0",
      colors: {
        "color1": "$undefined1",
        "color2": "$undefined2",
      },
    };

    const errors = validateVariableReferences(manifest);
    expect(errors.length).toBe(2);
  });
});

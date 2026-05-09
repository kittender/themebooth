import { validateManifest } from "../manifest";

describe("Manifest Validation", () => {
  it("should validate a minimal valid manifest", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      version: "1.0.0",
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ocean Dream");
    }
  });

  it("should fail when required fields are missing", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      // missing version
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.field?.includes("version"))).toBe(true);
    }
  });

  it("should validate hex colors in variables", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      version: "1.0.0",
      variables: {
        primaryBackground: "#0d1117",
        primaryText: "#fff",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should reject invalid hex colors in variables", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      version: "1.0.0",
      variables: {
        primaryBackground: "not-a-color",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.field?.includes("variables"))).toBe(true);
    }
  });

  it("should allow variable references in colors", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      version: "1.0.0",
      variables: {
        primaryBackground: "#0d1117",
      },
      colors: {
        "editor.background": "$primaryBackground",
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should validate token properties", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      version: "1.0.0",
      tokens: {
        keyword: {
          foreground: "#ff7b72",
          fontStyle: "bold",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(true);
  });

  it("should reject invalid token properties", () => {
    const manifest = {
      name: "Ocean Dream",
      author: "John Doe",
      version: "1.0.0",
      tokens: {
        keyword: {
          foreground: "#ff7b72",
          invalidProp: "value",
        },
      },
    };

    const result = validateManifest(manifest);
    expect(result.success).toBe(false);
  });

  it("should allow valid semver versions", () => {
    const validVersions = ["1.0.0", "0.0.1", "10.20.30"];
    validVersions.forEach(version => {
      const result = validateManifest({
        name: "Test",
        author: "Test",
        version,
      });
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid semver versions", () => {
    const invalidVersions = ["1.0", "v1.0.0", "1"];
    invalidVersions.forEach(version => {
      const result = validateManifest({
        name: "Test",
        author: "Test",
        version,
      });
      expect(result.success).toBe(false);
    });
  });
});

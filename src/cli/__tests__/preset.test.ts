import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { validateManifest } from "../../core/manifest";
import { readManifest, writeManifest } from "../../utils/paths";

// Helper function extracted from preset.ts for testability
function buildPresetFromOverrides(
  variables: Record<string, string>,
  overrides: Record<string, string>
): Record<string, unknown> {
  return {
    variableOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
  };
}

describe("buildPresetFromOverrides", () => {
  it("creates preset with variableOverrides when there are overrides", () => {
    const variables = { color: "#fff", accent: "#000" };
    const overrides = { color: "#abc" };
    const result = buildPresetFromOverrides(variables, overrides);
    expect(result.variableOverrides).toEqual({ color: "#abc" });
  });

  it("omits variableOverrides when empty", () => {
    const variables = { color: "#fff" };
    const overrides = {};
    const result = buildPresetFromOverrides(variables, overrides);
    expect(result.variableOverrides).toBeUndefined();
  });
});

describe("Preset integration", () => {
  let tempDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "themebooth-preset-test-"));
    manifestPath = path.join(tempDir, "manifest.json");

    // Create a basic valid manifest
    const manifest = {
      name: "test-theme",
      author: "Test Author",
      version: "1.0.0",
      variables: {
        "color-bg": "#1e1e1e",
        "color-fg": "#ffffff",
        "color-accent": "#0066cc",
      },
      colors: {},
      tokens: {},
    };

    await writeManifest(manifestPath, manifest);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it("loads and validates manifest for preset operations", async () => {
    const manifest = await readManifest(manifestPath);
    const validation = validateManifest(manifest);
    expect(validation.success).toBe(true);
  });

  it("can write a preset to an existing manifest", async () => {
    const manifest = (await readManifest(manifestPath)) as Record<string, unknown>;
    const preset = buildPresetFromOverrides(
      { "color-bg": "#1e1e1e", "color-fg": "#ffffff" },
      { "color-bg": "#ffffff", "color-fg": "#000000" }
    );

    if (!manifest.presets) {
      manifest.presets = {};
    }
    (manifest.presets as Record<string, unknown>)["light"] = preset;

    await writeManifest(manifestPath, manifest);

    // Verify it was written and is valid
    const reloaded = await readManifest(manifestPath);
    const validation = validateManifest(reloaded);
    expect(validation.success).toBe(true);
    expect((reloaded as Record<string, unknown>).presets).toBeDefined();
  });

  it("preserves manifest structure when adding multiple presets", async () => {
    const manifest = (await readManifest(manifestPath)) as Record<string, unknown>;
    if (!manifest.presets) {
      manifest.presets = {};
    }

    (manifest.presets as Record<string, unknown>)["light"] = {
      variableOverrides: { "color-bg": "#ffffff" },
    };
    (manifest.presets as Record<string, unknown>)["high-contrast"] = {
      variableOverrides: { "color-bg": "#000000", "color-fg": "#ffffff" },
    };

    await writeManifest(manifestPath, manifest);

    const reloaded = await readManifest(manifestPath);
    const validation = validateManifest(reloaded);
    expect(validation.success).toBe(true);

    const presets = (reloaded as Record<string, unknown>).presets as Record<string, unknown>;
    expect(Object.keys(presets)).toHaveLength(2);
    expect(presets.light).toBeDefined();
    expect(presets["high-contrast"]).toBeDefined();
  });
});

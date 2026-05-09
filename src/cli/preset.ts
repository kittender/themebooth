import * as readline from "readline";
import * as path from "path";
import { validateManifest, Preset, colorOrVariableRegex } from "../core/manifest";
import { readManifest, writeManifest, getThemeProjectPaths } from "../utils/paths";
import { logger } from "../utils/logger";

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function promptWithDefault(
  rl: readline.Interface,
  prompt: string,
  defaultValue: string
): Promise<string> {
  return new Promise((resolve) => {
    const displayPrompt = defaultValue ? `${prompt} [${defaultValue}]: ` : `${prompt}: `;
    rl.question(displayPrompt, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed === "" ? defaultValue : trimmed);
    });
  });
}

function buildPresetFromOverrides(
  variables: Record<string, string>,
  overrides: Record<string, string>
): Preset {
  return {
    variableOverrides: Object.keys(overrides).length > 0 ? overrides : undefined,
  };
}

export async function presetAddCommand(): Promise<void> {
  try {
    // Get manifest paths
    const paths = getThemeProjectPaths(process.cwd());
    const manifestData = await readManifest(paths.manifest);

    // Validate current manifest
    const validation = validateManifest(manifestData);
    if (!validation.success) {
      logger.error("Current manifest is invalid:");
      validation.errors.forEach((err) => {
        logger.error(`  • ${err.field}: ${err.message}`);
      });
      process.exit(1);
    }

    const manifest = validation.data;

    // Create readline interface
    const rl = createReadlineInterface();

    // Prompt for preset name
    let presetName: string = "";
    while (!presetName) {
      presetName = await promptWithDefault(rl, "Preset name", "");
      if (!presetName) {
        logger.warn("Preset name cannot be empty");
      }
    }

    // Check if preset already exists
    if (manifest.presets && manifest.presets[presetName]) {
      const overwrite = await promptWithDefault(rl, `Preset "${presetName}" already exists. Overwrite? (y/n)`, "n");
      if (overwrite.toLowerCase() !== "y") {
        rl.close();
        logger.info("Cancelled.");
        return;
      }
    }

    // Walk through each variable and prompt for overrides
    const overrides: Record<string, string> = {};
    const sortedVars = Object.entries(manifest.variables).sort(([a], [b]) => a.localeCompare(b));

    logger.info(`\nConfiguring preset "${presetName}":`);
    logger.info("Press Enter to keep current value, or type a new value.\n");

    for (const [varName, currentValue] of sortedVars) {
      const newValue = await promptWithDefault(rl, `  ${varName}`, currentValue);

      // Only collect if different from current
      if (newValue !== currentValue) {
        // Validate the value
        if (!colorOrVariableRegex.test(newValue)) {
          logger.warn(`⚠ "${newValue}" is not a valid color or variable. Skipping.`);
          continue;
        }
        overrides[varName] = newValue;
      }
    }

    rl.close();

    // Build the preset
    const preset = buildPresetFromOverrides(manifest.variables, overrides);

    // Update raw manifest and write back
    const rawManifest = (await readManifest(paths.manifest)) as Record<string, unknown>;
    if (!rawManifest.presets) {
      rawManifest.presets = {};
    }
    (rawManifest.presets as Record<string, unknown>)[presetName] = preset;

    await writeManifest(paths.manifest, rawManifest);

    if (Object.keys(overrides).length > 0) {
      logger.success(`✓ Preset "${presetName}" added with ${Object.keys(overrides).length} variable override(s)`);
    } else {
      logger.success(`✓ Preset "${presetName}" added (no variable overrides)`);
    }
  } catch (error) {
    logger.error(`Failed to add preset: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

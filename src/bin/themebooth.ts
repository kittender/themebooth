#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "../cli/init";
import { previewCommand } from "../cli/preview";
import { packageCommand } from "../cli/package";
import { publishCommand } from "../cli/publish";
import { presetAddCommand } from "../cli/preset";
import { logger } from "../utils/logger";

const program = new Command();

program
  .name("themebooth")
  .description("Create syntax themes once, publish to VS Code, Notepad++, and Zed")
  .version("0.1.0");

program
  .command("init [name]")
  .description("Initialize a new theme project")
  .option("-p, --preset <preset>", "Use a preset (dark, light, high-contrast)", "dark")
  .addHelpText("after", `
Examples:
  $ themebooth init my-theme
  $ themebooth init --preset light my-theme
  $ themebooth init  # Uses current directory name

Presets:
  dark          - Dark mode with cool blues (default)
  light         - Light mode with warm tones
  high-contrast - Accessibility-focused, max contrast
  `)
  .action(async (name, options) => {
    try {
      await initCommand(name, options.preset);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Start live preview server for theme editing")
  .addHelpText("after", `
Starts an Express server at http://localhost:5173 with hot-reload.
Watch manifest.json for changes and reload preview.html in browser.

Examples:
  $ themebooth preview
  $ themebooth preview  # Port auto-fallback if 5173 in use
  `)
  .action(async () => {
    try {
      await previewCommand();
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("package")
  .description("Package theme for all platforms (VS Code, Notepad++, Zed)")
  .addHelpText("after", `
Validates manifest.json, transpiles to each editor's native format.
Outputs packaged files to ./.themebooth/output/{theme-name}/

Examples:
  $ themebooth package
  $ ls ./.themebooth/output/
  `)
  .action(async () => {
    try {
      await packageCommand();
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("publish [platform]")
  .description("Publish theme to marketplace (vscode, notepad++, zed)")
  .addHelpText("after", `
Interactive flow for marketplace submission. Requires packaged output.

Platforms:
  vscode       - VS Code Marketplace
  notepad++    - Notepad++ Plugin Manager
  zed          - Zed Theme Registry

Examples:
  $ themebooth package
  $ themebooth publish vscode
  $ themebooth publish notepad++
  `)
  .action(async (platform) => {
    try {
      await publishCommand(platform);
    } catch (error) {
      process.exit(1);
    }
  });

const presetCmd = program
  .command("preset")
  .description("Manage theme presets");

presetCmd
  .command("add")
  .description("Interactively add a named preset to manifest.json")
  .addHelpText("after", `
Prompts for a preset name then walks through each variable,
allowing per-variable overrides. Press Enter to keep current value.

Examples:
  $ themebooth preset add
  `)
  .action(async () => {
    try {
      await presetAddCommand();
    } catch (error) {
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

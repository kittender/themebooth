#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { join } from "path";
import { initCommand } from "../cli/init";
import { previewCommand } from "../cli/preview";
import { packageCommand } from "../cli/package";
import { publishCommand } from "../cli/publish";
import { presetAddCommand } from "../cli/preset";
import { validateCommand } from "../cli/validate";
import { exportCommand, exportSublimePackageCommand, exportIntellijCommand, exportIntellijPackageCommand, exportEclipseCommand, exportVSCodeExtensionCommand } from "../cli/export";
import { logger } from "../utils/logger";

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf-8")
);

const program = new Command();

program
  .name("themebooth")
  .description("Create syntax themes once, publish to VS Code, JetBrains, Eclipse, Notepad++, Zed, and more")
  .version(packageJson.version, "-v, --version");

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
  .command("validate [path]")
  .description("Validate manifest.json for errors and compatibility")
  .option("--fix", "Auto-convert colors to hex format")
  .option("--ci", "Machine-readable JSON output for CI/CD")
  .addHelpText("after", `
Comprehensive validation: schema, variables, colors, tokens, presets, extends.
Catches errors at edit time before packaging.

Examples:
  $ themebooth validate
  $ themebooth validate ./custom.json
  $ themebooth validate --fix
  $ themebooth validate --ci | jq .valid
  `)
  .action(async (path, options) => {
    try {
      await validateCommand(path, {
        fix: options.fix || false,
        ci: options.ci || false,
      });
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

program
  .command("export <platform>")
  .description("Export theme to specific platform (sublime, vscode, zed, notepad++, intellij, eclipse, vscode-extension)")
  .option("-o, --output <path>", "Output directory for exported files")
  .addHelpText("after", `
Export theme to single platform in a custom output directory.
Useful for testing individual platform exports before packaging.

Platforms:
  sublime             - Sublime Text color scheme
  vscode              - VS Code theme
  zed                 - Zed editor theme
  notepad++           - Notepad++ syntax highlighting
  intellij            - JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, Rider)
  eclipse             - Eclipse IDE color theme
  vscode-extension    - VS Code extension scaffold (publishable extension)

Examples:
  $ themebooth export sublime
  $ themebooth export vscode
  $ themebooth export intellij
  $ themebooth export eclipse
  $ themebooth export vscode-extension
  `)
  .action(async (platform, options) => {
    try {
      if (platform.toLowerCase() === "intellij") {
        await exportIntellijCommand(options);
      } else if (platform.toLowerCase() === "eclipse") {
        await exportEclipseCommand(options);
      } else if (platform.toLowerCase() === "vscode-extension") {
        await exportVSCodeExtensionCommand(options);
      } else {
        await exportCommand(platform, options);
      }
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("export-sublime-package")
  .description("Create Sublime Text package for Package Control submission")
  .option("-n, --name <name>", "Package name (default: sublime-{theme-name})")
  .option("-o, --output <path>", "Output directory")
  .option("--url <url>", "Package repository URL (for Package Control)")
  .option("--homepage <url>", "Homepage URL")
  .option("--dev", "Create development package (.no-sublime-package)")
  .addHelpText("after", `
Creates complete Sublime Text package structure ready for submission
to Package Control. Includes color scheme, UI theme, and metadata.

Examples:
  $ themebooth export-sublime-package
  $ themebooth export-sublime-package -n my-cool-theme
  $ themebooth export-sublime-package --url https://github.com/user/repo
  `)
  .action(async (options) => {
    try {
      await exportSublimePackageCommand(options);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("export-intellij-package")
  .description("Create JetBrains plugin package for Marketplace submission")
  .option("-n, --name <name>", "Package name (default: intellij-{theme-name})")
  .option("-o, --output <path>", "Output directory")
  .option("--format <jar|zip>", "Package format", "jar")
  .addHelpText("after", `
Creates complete JetBrains plugin package ready for submission
to the JetBrains Marketplace. Includes .icls color scheme and plugin.xml metadata.

Supports: IntelliJ IDEA, PyCharm, WebStorm, Rider

Examples:
  $ themebooth export-intellij-package
  $ themebooth export-intellij-package -n my-cool-theme
  $ themebooth export-intellij-package --format zip
  `)
  .action(async (options) => {
    try {
      await exportIntellijPackageCommand(options);
    } catch (error) {
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

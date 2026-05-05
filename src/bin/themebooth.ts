#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "../cli/init";
import { previewCommand } from "../cli/preview";
import { packageCommand } from "../cli/package";
import { publishCommand } from "../cli/publish";
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
  .action(async (name, options) => {
    try {
      await initCommand(name, options.preset);
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Start live preview server")
  .action(async () => {
    try {
      await previewCommand();
    } catch (error) {
      process.exit(1);
    }
  });

program
  .command("package")
  .description("Package theme for all platforms")
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
  .action(async (platform) => {
    try {
      await publishCommand(platform);
    } catch (error) {
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

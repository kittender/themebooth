import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger";

interface NotepadSubmissionGuide {
  xmlPath: string;
  themeName: string;
  author: string;
}

function generateSubmissionChecklist(guide: NotepadSubmissionGuide): string {
  const { xmlPath, themeName, author } = guide;
  const fileName = path.basename(xmlPath);

  return `
# Notepad++ Theme Submission Checklist

## Pre-Submission
- [ ] Theme tested in Notepad++ (latest version)
- [ ] XML file is well-formed (no parsing errors)
- [ ] All color codes are valid hex format
- [ ] Theme name is unique and descriptive
- [ ] Author name is included in XML

## GitHub Fork & PR Setup
- [ ] Forked https://github.com/notepad-plus-plus/nppPluginList
- [ ] Created new branch: \`add-${themeName.toLowerCase()}\`
- [ ] Copied ${fileName} to \`plugins/xml/\`
- [ ] Updated \`plugins/plugin.md\` with:
  * Theme name and description
  * Author: ${author}
  * Download link (if applicable)
  * Installation instructions

## Pull Request
- [ ] PR title: "Add ${themeName} theme"
- [ ] PR description includes theme preview/screenshot
- [ ] Links to any external resources (blog post, etc.)
- [ ] Ready for review

## Post-Submission
- [ ] Awaiting reviewer feedback
- [ ] Addressed any requested changes
- [ ] Theme merged and available in Plugin Manager

## File Details
- **Location:** ${path.relative(process.cwd(), xmlPath)}
- **Size:** Check file is not empty
- **Format:** Valid Notepad++ XML UDL (User Defined Language)
`;
}

export async function handleNotepadPublish(
  themePackagePath: string,
  themeName: string,
  manifest: any
): Promise<void> {
  logger.title("Notepad++ Theme Submission Guide");
  logger.info("");

  // Find XML file
  const xmlFile = path.join(themePackagePath, `${themeName}.xml`);
  try {
    await fs.access(xmlFile);
  } catch {
    throw new Error(`Notepad++ XML file not found: ${xmlFile}`);
  }

  // Validate XML
  const xmlContent = await fs.readFile(xmlFile, "utf-8");
  if (!xmlContent.includes("<NotepadPlus") && !xmlContent.includes("<UserLang")) {
    throw new Error("Invalid Notepad++ XML format");
  }

  logger.info("📝 Notepad++ Plugin Manager Submission");
  logger.info("");
  logger.info("Unlike VS Code and Zed, Notepad++ themes are submitted via GitHub PR");
  logger.info("to the nppPluginList repository. This is a semi-manual process.\n");

  // Display step-by-step instructions
  logger.info("STEP 1: Create GitHub Account");
  logger.info("  → Go to: https://github.com/notepad-plus-plus/nppPluginList");
  logger.info("  → Fork the repository to your GitHub account");
  logger.info("");

  logger.info("STEP 2: Clone & Create Branch");
  logger.info("  $ git clone https://github.com/YOUR_USERNAME/nppPluginList.git");
  logger.info("  $ cd nppPluginList");
  logger.info(`  $ git checkout -b add-${themeName.toLowerCase()}`);
  logger.info("");

  logger.info("STEP 3: Add Theme File");
  logger.info("  Create directory if needed: plugins/xml/");
  logger.info(`  $ cp ${path.relative(process.cwd(), xmlFile)} plugins/xml/`);
  logger.info("");

  logger.info("STEP 4: Update Plugin Registry");
  logger.info("  → Open: plugins/plugin.md");
  logger.info("  → Add your theme entry with:");
  logger.info(`     - name: ${themeName}`);
  logger.info(`     - author: ${manifest.author || "Your Name"}`);
  logger.info(`     - version: ${manifest.version || "1.0.0"}`);
  logger.info(`     - description: ${manifest.description || "A custom syntax theme"}`);
  logger.info("");

  logger.info("STEP 5: Commit & Push");
  logger.info(`  $ git add plugins/xml/${themeName}.xml plugins/plugin.md`);
  logger.info(`  $ git commit -m "Add ${themeName} theme"`);
  logger.info("  $ git push origin " + `add-${themeName.toLowerCase()}`);
  logger.info("");

  logger.info("STEP 6: Create Pull Request");
  logger.info("  → Go to: https://github.com/notepad-plus-plus/nppPluginList");
  logger.info("  → Click: 'Create Pull Request'");
  logger.info(`  → Title: "Add ${themeName} theme"`);
  logger.info("  → Description: Include theme preview, features, and author credit");
  logger.info("");

  logger.info("Theme File Location:");
  logger.info(`  ${path.relative(process.cwd(), xmlFile)}`);
  logger.info("");

  // Generate and show checklist
  const checklist = generateSubmissionChecklist({
    xmlPath: xmlFile,
    themeName,
    author: manifest.author || "Unknown",
  });

  logger.info("📋 Submission Checklist:");
  logger.info(checklist);

  logger.info("🔗 Helpful Links:");
  logger.info("  Plugin Registry: https://github.com/notepad-plus-plus/nppPluginList");
  logger.info("  Notepad++ UDL Guide: https://notepad-plus-plus.org/docs/user-defined-language/");
  logger.info("  XML Format Reference: https://notepad-plus-plus.org/docs/plugins/plugin-admin/");
  logger.info("");

  logger.success("✓ Ready for manual submission!");
}

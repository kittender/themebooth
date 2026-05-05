import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger";
import { getThemeProjectPaths, ensureThemeProjectStructure, writeManifest } from "../utils/paths";
import { Manifest } from "../core/manifest";

const GITIGNORE_CONTENT = `# Generated files
preview.html
dist/
node_modules/

# Cache
.themebooth/cache/
.themebooth/output/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`;

const CUSTOM_MANIFEST: Manifest = {
  name: "My Custom Theme",
  description: "A beautiful custom syntax theme",
  author: "Your Name",
  version: "1.0.0",
  variables: {
    background: "#1e1e1e",
    foreground: "#d4d4d4",
    accent: "#007acc",
    keyword: "#569cd6",
    string: "#ce9178",
    comment: "#6a9955",
    number: "#b5cea8",
    builtin: "#4ec9b0",
    error: "#f48771",
  },
  colors: {
    "editor.background": "$background",
    "editor.foreground": "$foreground",
    "editor.lineNumberActiveForeground": "$accent",
    "editor.selectionBackground": "#264f78",
    "editor.wordHighlightBackground": "#575757",
    "editorCursor.foreground": "$accent",
    "editorWhitespace.foreground": "#464646",
  },
  tokens: {
    keyword: {
      foreground: "$keyword",
      fontStyle: "bold",
    },
    string: {
      foreground: "$string",
    },
    comment: {
      foreground: "$comment",
      fontStyle: "italic",
    },
    number: {
      foreground: "$number",
    },
    "constant.builtin": {
      foreground: "$builtin",
    },
  },
  presets: [],
};

async function loadPresetsFromFiles(): Promise<Record<string, Manifest>> {
  const presetsDir = path.join(__dirname, "../templates/presets");
  const presets: Record<string, Manifest> = {};

  try {
    const files = await fs.readdir(presetsDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const presetName = file.replace(".json", "");
        const filePath = path.join(presetsDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        presets[presetName] = JSON.parse(content) as Manifest;
      }
    }
  } catch (error) {
    // Fall back to hardcoded custom if files not found
    logger.warn("Could not load preset files, using fallback templates");
  }

  return presets;
}

function generatePreviewHtml(themeName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${themeName} - Live Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background-color: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 10px;
      color: #61dafb;
    }

    .subtitle {
      color: #888;
      margin-bottom: 30px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section h2 {
      font-size: 18px;
      color: #61dafb;
      margin-bottom: 15px;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
    }

    .code-sample {
      background-color: #252526;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      margin-bottom: 15px;
    }

    .code-sample code {
      display: block;
    }

    .keyword { color: #569cd6; font-weight: bold; }
    .string { color: #ce9178; }
    .comment { color: #6a9955; font-style: italic; }
    .number { color: #b5cea8; }
    .builtin { color: #4ec9b0; }

    .palette {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .color-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      background-color: #252526;
    }

    .color-box .swatch {
      width: 100%;
      height: 80px;
      border-radius: 4px;
      margin-bottom: 10px;
      border: 1px solid #3e3e42;
    }

    .color-box .name {
      font-size: 12px;
      color: #888;
      text-align: center;
      word-break: break-word;
    }

    .color-box .value {
      font-size: 11px;
      color: #61dafb;
      font-family: monospace;
      margin-top: 5px;
    }

    .status {
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .status.success {
      background-color: #1f6f1f;
      color: #6ec46e;
    }

    .status.error {
      background-color: #6f1f1f;
      color: #c46e6e;
    }

    .reload-hint {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #333;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 10px 15px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${themeName}</h1>
    <p class="subtitle">Live Preview • Edit manifest.json to see changes</p>

    <div id="status" class="status success" style="display:none;"></div>

    <div class="section">
      <h2>Color Palette</h2>
      <div class="palette" id="palette"></div>
    </div>

    <div class="section">
      <h2>JavaScript</h2>
      <div class="code-sample">
        <code>
<span class="keyword">const</span> greeting = <span class="string">"Hello, World!"</span>;
<span class="keyword">function</span> greet(name) {
  <span class="comment">// Print greeting</span>
  console.log(\`\${greeting} My name is \${name}\`);
  <span class="keyword">return</span> <span class="number">42</span>;
}
        </code>
      </div>
    </div>

    <div class="section">
      <h2>Python</h2>
      <div class="code-sample">
        <code>
<span class="keyword">def</span> greet(name):
    <span class="comment"># Print greeting</span>
    greeting = <span class="string">"Hello, World!"</span>
    print(f<span class="string">"{greeting} My name is {name}"</span>)
    <span class="keyword">return</span> <span class="number">42</span>

greet(<span class="string">"Python"</span>)
        </code>
      </div>
    </div>

    <div class="section">
      <h2>JSON</h2>
      <div class="code-sample">
        <code>
{
  <span class="string">"name"</span>: <span class="string">"My Theme"</span>,
  <span class="string">"version"</span>: <span class="string">"1.0.0"</span>,
  <span class="string">"colors"</span>: {
    <span class="string">"background"</span>: <span class="string">"#1e1e1e"</span>,
    <span class="string">"foreground"</span>: <span class="string">"#d4d4d4"</span>
  }
}
        </code>
      </div>
    </div>
  </div>

  <div class="reload-hint">🔄 Watching for changes...</div>

  <script>
    // Hot-reload on file change
    const ws = new WebSocket(\`ws://\${window.location.host}/ws\`);
    ws.addEventListener('message', (event) => {
      if (event.data === 'reload') {
        window.location.reload();
      }
    });
    ws.addEventListener('error', () => {
      console.log('WebSocket connection failed - hot-reload unavailable');
    });
  </script>
</body>
</html>
`;
}

export async function initCommand(themeName?: string, presetName?: string): Promise<void> {
  try {
    // Use provided theme name or current directory name
    const finalThemeName = themeName || path.basename(process.cwd());

    if (!finalThemeName) {
      logger.error("Theme name is required");
      throw new Error("Theme name is required");
    }

    const themeDir = themeName ? path.join(process.cwd(), themeName) : process.cwd();
    const paths = getThemeProjectPaths(themeDir);

    // Ensure structure exists
    await ensureThemeProjectStructure(paths);

    // Load presets from files
    const presetManifests = await loadPresetsFromFiles();

    // Determine which preset to use
    let selectedPreset = CUSTOM_MANIFEST;
    if (presetName) {
      if (presetName in presetManifests) {
        selectedPreset = presetManifests[presetName];
      } else {
        logger.warn(`Preset "${presetName}" not found, using default dark preset`);
        selectedPreset = presetManifests["dark"] || CUSTOM_MANIFEST;
      }
    } else if (Object.keys(presetManifests).length > 0) {
      // Use first available preset (dark) as default
      selectedPreset = presetManifests["dark"] || Object.values(presetManifests)[0] || CUSTOM_MANIFEST;
    }

    // Create manifest with user's theme name
    const manifest = { ...selectedPreset, name: finalThemeName };
    await writeManifest(paths.manifest, manifest as unknown as Record<string, unknown>);

    // Write .gitignore
    await fs.writeFile(path.join(paths.root, ".gitignore"), GITIGNORE_CONTENT, "utf-8");

    // Write preview.html
    const previewHtml = generatePreviewHtml(finalThemeName);
    await fs.writeFile(paths.preview, previewHtml, "utf-8");

    // Success output
    logger.success(`Theme project created at ${themeDir}`);
    logger.info(`\nFiles created:`);
    logger.info(`  • manifest.json - Theme definition`);
    logger.info(`  • preview.html - Live preview (in .gitignore)`);
    logger.info(`  • .gitignore - Git ignore rules`);
    logger.info(`  • .themebooth/cache/ - Transpilation cache`);
    logger.info(`\nNext steps:`);
    logger.info(`  cd ${themeName ? themeName : "."}`);
    logger.info(`  themebooth preview`);
  } catch (error) {
    logger.error(`Failed to initialize theme: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

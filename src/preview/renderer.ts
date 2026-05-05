import { Manifest } from "../core/manifest";
import { resolveVariables, interpolateManifest } from "../core/variables";

function generateColorPalette(manifest: Manifest, resolved: Record<string, string>): string {
  let html = "";

  for (const [name, color] of Object.entries(manifest.variables || {})) {
    const resolvedColor = resolved[name] || color;
    html += `
    <div class="color-box">
      <div class="swatch" style="background-color: ${resolvedColor};"></div>
      <div class="name">${name}</div>
      <div class="value">${resolvedColor}</div>
    </div>`;
  }

  return html;
}

function generateCSSFromTheme(manifest: Manifest): string {
  let css = "";

  // Set root colors
  if (manifest.colors?.["editor.background"]) {
    css += `body { background-color: ${manifest.colors["editor.background"]}; }\n`;
  }
  if (manifest.colors?.["editor.foreground"]) {
    css += `body { color: ${manifest.colors["editor.foreground"]}; }\n`;
  }

  // Token styles
  css += `.keyword { color: ${manifest.tokens?.keyword?.foreground || "#569cd6"}; `;
  if (typeof manifest.tokens?.keyword?.fontStyle === "string" && manifest.tokens.keyword.fontStyle.includes("bold")) css += "font-weight: bold; ";
  css += "}\n";

  css += `.string { color: ${manifest.tokens?.string?.foreground || "#ce9178"}; }\n`;

  css += `.comment { color: ${manifest.tokens?.comment?.foreground || "#6a9955"}; `;
  if (typeof manifest.tokens?.comment?.fontStyle === "string" && manifest.tokens.comment.fontStyle.includes("italic")) css += "font-style: italic; ";
  css += "}\n";

  css += `.number { color: ${manifest.tokens?.number?.foreground || "#b5cea8"}; }\n`;
  css += `.builtin { color: ${manifest.tokens?.["constant.builtin"]?.foreground || "#4ec9b0"}; }\n`;

  return css;
}

export function renderPreview(manifest: Manifest, themeName: string): string {
  // Resolve variables for color display
  const variableResolution = resolveVariables(manifest);
  const resolved =
    variableResolution.success ? variableResolution.variables : {};

  // Get interpolated manifest for rendering
  const interpolated =
    variableResolution.success ?
      interpolateManifest(manifest, resolved)
      : manifest;

  const colorPalette = generateColorPalette(manifest, resolved);
  const themeCSS = generateCSSFromTheme(interpolated);

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
      background-color: ${interpolated.colors?.["editor.background"] || "#1e1e1e"};
      color: ${interpolated.colors?.["editor.foreground"] || "#d4d4d4"};
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 10px;
      color: ${interpolated.colors?.["editor.lineNumberActiveForeground"] || "#61dafb"};
    }

    .subtitle {
      color: ${interpolated.colors?.["editorWhitespace.foreground"] || "#888"};
      margin-bottom: 30px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section h2 {
      font-size: 18px;
      color: ${interpolated.colors?.["editor.lineNumberActiveForeground"] || "#61dafb"};
      margin-bottom: 15px;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
    }

    .code-sample {
      background-color: ${interpolated.colors?.["editor.background"] || "#252526"};
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      margin-bottom: 15px;
    }

    .code-sample code {
      display: block;
    }

    ${themeCSS}

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
      background-color: ${interpolated.colors?.["editor.background"] || "#252526"};
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
      color: ${interpolated.colors?.["editorWhitespace.foreground"] || "#888"};
      text-align: center;
      word-break: break-word;
    }

    .color-box .value {
      font-size: 11px;
      color: ${interpolated.colors?.["editor.lineNumberActiveForeground"] || "#61dafb"};
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
      <div class="palette" id="palette">${colorPalette}</div>
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
    <span class="string">"background"</span>: <span class="string">"${interpolated.colors?.["editor.background"] || "#1e1e1e"}"</span>,
    <span class="string">"foreground"</span>: <span class="string">"${interpolated.colors?.["editor.foreground"] || "#d4d4d4"}"</span>
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
</html>`;
}

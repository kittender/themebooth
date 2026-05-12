# JetBrains IDE Theme Export Guide

Export your Themebooth theme to JetBrains IDEs including IntelliJ IDEA, PyCharm, WebStorm, Rider, and more.

## Supported IDEs

- **IntelliJ IDEA** (Community & Ultimate)
- **PyCharm** (Community & Professional)
- **WebStorm**
- **Rider** (.NET IDE)
- **CLion** (C/C++ IDE)
- **GoLand** (Go IDE)
- **RubyMine** (Ruby IDE)
- And other JetBrains IDEs using the same platform

All these IDEs use the same `.icls` (IntelliJ Color Scheme XML) format, so a single theme works across all of them.

## Quick Start

### 1. Create a JetBrains Overlay

Create a `jetbrains.json` file in your theme project directory with color and token overrides:

```json
{
  "inherits": "base",
  "colors": {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editor.lineNumbers": "#858585",
    "editor.selection": "#264f78",
    "editor.cursor": "#d4d4d4",
    "editor.cursorLine": "#1f1f1f"
  },
  "tokenOverrides": {
    "keyword": {
      "foreground": "#569cd6",
      "fontStyle": "bold"
    },
    "string": {
      "foreground": "#ce9178"
    },
    "comment": {
      "foreground": "#6a9955",
      "fontStyle": "italic"
    },
    "function": {
      "foreground": "#dcdcaa"
    }
  }
}
```

### 2. Export the Theme

```bash
# Export to .icls file and plugin.xml
themebooth export intellij

# Export and package for Marketplace submission
themebooth export-intellij-package
```

### 3. Install Locally

Copy the exported `.icls` file to the JetBrains settings directory:

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/JetBrains/IntelliJIdea2024.1/colors
cp output/MyTheme.icls ~/Library/Application\ Support/JetBrains/IntelliJIdea2024.1/colors/
```

**Linux:**
```bash
mkdir -p ~/.config/JetBrains/IntelliJIdea2024.1/colors
cp output/MyTheme.icls ~/.config/JetBrains/IntelliJIdea2024.1/colors/
```

**Windows:**
```cmd
mkdir "%APPDATA%\JetBrains\IntelliJIdea2024.1\colors"
copy output\MyTheme.icls "%APPDATA%\JetBrains\IntelliJIdea2024.1\colors\"
```

Then restart IDE and go **Settings > Editor > Color Scheme** to select your theme.

## jetbrains.json Overlay Reference

### Editor Colors

These map to the editor UI and gutter:

```json
{
  "colors": {
    "editor.background": "#1e1e1e",           // Main editor background
    "editor.foreground": "#d4d4d4",           // Default text color
    "editor.lineNumbers": "#858585",          // Line number gutter
    "editor.lineNumbersBackground": "#1e1e1e", // Gutter background
    "editor.selection": "#264f78",            // Text selection highlight
    "editor.selectionForeground": "#ffffff",  // Selected text color
    "editor.cursor": "#d4d4d4",               // Caret/cursor color
    "editor.cursorLine": "#1f1f1f",           // Current line background
    "editor.indentGuide": "#404040",          // Indent guide lines
    "editor.whitespace": "#3e3e42"            // Whitespace character color
  }
}
```

### Token Overrides

Map Themebooth token scopes to JetBrains semantic tokens:

```json
{
  "tokenOverrides": {
    "keyword": { "foreground": "#569cd6", "fontStyle": "bold" },
    "string": { "foreground": "#ce9178" },
    "string.template": { "foreground": "#ce9178" },
    "comment": { "foreground": "#6a9955", "fontStyle": "italic" },
    "comment.line": { "foreground": "#6a9955" },
    "comment.block": { "foreground": "#6a9955" },
    "function": { "foreground": "#dcdcaa" },
    "function.call": { "foreground": "#dcdcaa" },
    "function.declaration": { "foreground": "#dcdcaa" },
    "variable": { "foreground": "#9cdcfe" },
    "variable.declaration": { "foreground": "#9cdcfe" },
    "variable.parameter": { "foreground": "#9cdcfe" },
    "class": { "foreground": "#4ec9b0" },
    "class.declaration": { "foreground": "#4ec9b0" },
    "type": { "foreground": "#4ec9b0" },
    "constant": { "foreground": "#4fc1ff" },
    "number": { "foreground": "#b5cea8" },
    "boolean": { "foreground": "#569cd6" },
    "operator": { "foreground": "#d4d4d4" },
    "tag": { "foreground": "#569cd6" },
    "attribute": { "foreground": "#9cdcfe" }
  }
}
```

### Font Styles

```json
{
  "tokenOverrides": {
    "keyword": { "fontStyle": "bold" },           // Bold
    "comment": { "fontStyle": "italic" },         // Italic
    "constant": { "fontStyle": "bold italic" }    // Bold + Italic (space-separated)
  }
}
```

## Export Workflow

### Step 1: Basic Export

```bash
themebooth export intellij
```

**Output:**
- `{theme-name}.icls` - Color scheme file
- `plugin.xml` - Plugin metadata

Use this to test the theme locally before packaging.

### Step 2: Package for Marketplace

```bash
themebooth export-intellij-package
```

**Output structure:**
```
intellij-{theme-name}/
├── plugin.xml
├── theme/
│   └── {theme-name}.icls
└── META-INF/
    └── MANIFEST.MF
```

### Step 3: Create JAR (for Marketplace)

The packaged directory needs to be zipped and renamed to `.jar`:

```bash
# From the export-intellij-package output
cd intellij-{theme-name}
zip -r ../intellij-{theme-name}.jar *
```

## Manifest.json Integration

Your main `manifest.json` should include theme metadata:

```json
{
  "name": "My Cool Theme",
  "author": "Your Name",
  "version": "1.0.0",
  "description": "A beautiful dark theme for JetBrains IDEs",
  "colors": {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4"
  },
  "tokens": {
    "keyword": { "foreground": "#569cd6" }
  }
}
```

Then the `jetbrains.json` overlay provides IDE-specific overrides:

```json
{
  "inherits": "base",
  "colors": {
    "editor.lineNumbers": "#858585"
  },
  "tokenOverrides": {
    "keyword": { "fontStyle": "bold" }
  }
}
```

## Scope to Semantic Token Mapping

Themebooth scopes are automatically mapped to JetBrains semantic tokens:

| Themebooth | JetBrains |
|------------|-----------|
| `keyword` | `KEYWORD` |
| `string` | `STRING` |
| `comment` | `COMMENTS` |
| `function` | `FUNCTION_DECLARATION` / `FUNCTION_CALL` |
| `variable` | `LOCAL_VARIABLE` |
| `class` | `CLASS_NAME` |
| `type` | `CLASS_NAME` |
| `constant` | `CONSTANT` |
| `operator` | `OPERATION_SIGN` |
| `number` | `NUMBER` |
| `boolean` | `BOOLEAN` |
| `tag` | `XML_TAG` |
| `attribute` | `XML_ATTRIBUTE_NAME` |

If you use custom scopes, they'll be converted to uppercase: `myCustomScope` → `MYCUSTOMSCOPE`.

## Testing Your Theme

### Local Installation

1. Export the theme
2. Copy `.icls` file to your IDE's colors directory (see paths above)
3. Restart IDE
4. Go to **Settings > Editor > Color Scheme** and select your theme

### Verify Colors

Open a code file and check:
- ✓ Syntax highlighting colors match
- ✓ Editor background is correct
- ✓ Line numbers are readable
- ✓ Cursor visibility in current line
- ✓ Selection highlighting works
- ✓ Indentation guides are visible

### Testing Multiple IDEs

Since all JetBrains IDEs use the same format, test with:
- IntelliJ IDEA (full IDE experience)
- PyCharm (Python-specific features)
- WebStorm (JavaScript/TypeScript)

The `.icls` file works identically across all of them.

## Troubleshooting

### Theme not appearing in Settings

1. Verify IDE has restarted (colors are cached)
2. Check `.icls` file is in correct directory
3. Try **File > Invalidate Caches** (IntelliJ)
4. Look for error messages in IDE logs: `~/.config/JetBrains/IntelliJIdea*/system/log/idea.log`

### Colors look wrong

1. Verify `jetbrains.json` has all required colors
2. Check hex color format: must be `#RRGGBB` without spaces
3. Verify token mapping is correct
4. Some colors may be inherited from parent scheme

### Plugin.xml errors when submitting

- Verify plugin ID is unique (e.g., `com.yourname.mytheme`)
- Ensure version follows semver (e.g., `1.0.0`)
- Check vendor name and email are filled
- IDE version should be `since-build="211.0"` or later

## Advanced: Custom Token Groups

For language-specific highlighting, add to `jetbrains.json`:

```json
{
  "tokenOverrides": {
    "python.keyword": { "foreground": "#569cd6" },
    "javascript.string": { "foreground": "#ce9178" },
    "markdown.heading": { "foreground": "#4ec9b0", "fontStyle": "bold" }
  }
}
```

Language-specific tokens are automatically scoped by JetBrains based on file type.

## Next Steps

See [jetbrains-marketplace.md](./jetbrains-marketplace.md) for publishing to the JetBrains Marketplace.

# Theme Booth

Create beautiful syntax highlighting themes for VS Code, Notepad++, and Zed—without learning three different config formats. Write once, publish everywhere.

## Install

```bash
npm install -g themebooth
```

## Quickstart

### 1. Initialize a new theme

```bash
themebooth init my_theme
cd my_theme
```

Creates a project with `manifest.json` (your theme definition) and a live preview setup.

### 2. Define your theme

Edit `manifest.json` with your color palette and syntax rules. Define colors once as variables, reuse them everywhere:

```json
{
  "name": "Ocean Dream",
  "description": "A cool, calm syntax theme",
  "author": "you@example.com",
  "variables": {
    "bg": "#0d1117",
    "fg": "#c9d1d9",
    "accent": "#58a6ff",
    "error": "#ff7b72",
    "string": "#a371f7",
    "comment": "#8b949e"
  },
  "colors": {
    "background": "$bg",
    "foreground": "$fg"
  },
  "tokens": {
    "keyword": { "foreground": "$error", "fontStyle": "bold" },
    "string": { "foreground": "$string" },
    "comment": { "foreground": "$comment", "fontStyle": "italic" }
  }
}
```

Use `$variableName` anywhere in the file. Change a color once, updates everywhere.

### 3. Preview live changes

```bash
themebooth preview
```

Opens `preview.html` in your browser. Edit `manifest.json`, and the preview reloads automatically. Test with built-in code samples or paste your own code.

### 4. Package your theme

```bash
themebooth package
```

Generates `ocean-dream/` with ready-to-publish formats for all 3 platforms.

### 5. Publish to marketplaces

**VS Code:**  
```bash
themebooth publish vscode
```

**Notepad++:**  
```bash
themebooth publish notepad++
```

**Zed:**  
```bash
themebooth publish zed
```

Each command guides you through marketplace login and submission.

## What v1 supports

- **3 editors**: VS Code, Notepad++, Zed
- **Single JSON theme definition** (no per-editor config files in v1)
- **Color variables** (`$colorName`) for DRY theming—define once, reuse everywhere
- **Live HTML preview** with code samples
- **One-command packaging** to editor-native formats
- **Built-in syntax presets** (light, dark, high contrast templates)

## How it works

1. Write a single `manifest.json` with your colors and token rules
2. Theme Booth transpiles it into each editor's native format:
   - VS Code → `.json` theme file
   - Notepad++ → `.xml` style definition
   - Zed → `.json` theme file
3. Publish directly from CLI using your marketplace credentials

## Documentation

- **[Manifest Schema](MANIFEST_SCHEMA.md)** — Complete reference for `manifest.json`
- **[CLI Commands](CLI_HELP.md)** — Detailed help for each command
- **[Troubleshooting](TROUBLESHOOTING.md)** — Solutions for common issues
- **[Contributing](CONTRIBUTING.md)** — How to contribute to Theme Booth

## Examples

### Create a theme from preset
```bash
themebooth init ocean-dream --preset dark
cd ocean-dream
themebooth preview
```

### Use custom colors
Edit `manifest.json`:
```json
{
  "name": "My Theme",
  "author": "Your Name",
  "description": "Custom syntax theme",
  "version": "1.0.0",
  "variables": {
    "bg": "#0d1117",
    "fg": "#c9d1d9",
    "keyword": "#ff6b6b"
  },
  "colors": {
    "editor.background": "$bg",
    "editor.foreground": "$fg"
  },
  "tokens": {
    "keyword": { "foreground": "$keyword", "fontStyle": "bold" }
  },
  "presets": []
}
```

Then preview:
```bash
themebooth preview
```

Changes to `manifest.json` reload automatically.

## CLI Commands

| Command | Purpose |
|---------|---------|
| `themebooth init [name]` | Create new theme project |
| `themebooth preview` | Live preview with hot-reload |
| `themebooth package` | Package for all platforms |
| `themebooth publish <platform>` | Publish to marketplace |

See `themebooth --help` or `themebooth <command> --help` for detailed options.

## Next: Future versions

**v2** adds Sublime Text, IntelliJ IDEA, and PyCharm with multi-file support and language-specific overrides.

**v3** brings Eclipse and Visual Studio with advanced plugin structures.

---

See [ROADMAP.md](ROADMAP.md) for the full vision.

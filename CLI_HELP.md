# CLI Commands Reference

Detailed help for all Theme Booth CLI commands.

## Overview

```bash
themebooth --help          # Show all commands
themebooth <command> --help  # Show command help
```

## Global Options

```
--version  Show version number
--help     Show help text
```

---

## `themebooth init [name]`

Initialize a new theme project.

### Usage

```bash
themebooth init                    # Use current dir name
themebooth init my-theme           # Create my-theme/
themebooth init my-theme --preset light  # Use light preset
```

### Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--preset` | `-p` | string | `dark` | Preset template: `dark`, `light`, `high-contrast` |

### Output

Creates theme project directory with:
- `manifest.json` — Theme definition
- `preview.html` — Live preview (generated)
- `.themebooth/cache/` — Temp cache dir
- `.themebooth/output/` — Package output dir
- `.gitignore` — Git ignore rules

### Examples

```bash
# Create "my-theme" directory with dark preset
$ themebooth init my-theme
✅ Created theme project at ./my-theme
   - manifest.json (dark preset)
   - .themebooth/cache/ (cache)
   - .themebooth/output/ (outputs)
Next: cd my-theme && themebooth preview

# Create theme with light preset
$ themebooth init ocean-theme --preset light
✅ Created theme project at ./ocean-theme
   - manifest.json (light preset)
Next: cd ocean-theme && themebooth preview

# Use current directory
$ mkdir my-dark-theme && cd my-dark-theme
$ themebooth init
✅ Created theme project
```

### Presets

| Preset | Colors | Contrast | Best For |
|--------|--------|----------|----------|
| `dark` | Cool blues, warm oranges | WCAG AAA | Night coding, most users |
| `light` | Blues, oranges, greens | WCAG AAA | Daytime, bright environments |
| `high-contrast` | Pure black, bright colors | 21:1 | Accessibility, low vision |

### Common Issues

**Directory already exists:**
```bash
# Error: "Directory already exists: my-theme"
# Solution: Use different name or remove directory
rm -rf my-theme
themebooth init my-theme
```

**Preset files not found:**
```bash
# Error: "Could not load preset files"
# Solution: Rebuild
npm run build
```

---

## `themebooth preview`

Start live preview server with hot-reload.

### Usage

```bash
themebooth preview        # Start at localhost:5173
```

### Behavior

1. Starts Express server at `http://localhost:5173`
2. Watches `manifest.json` for changes
3. Reloads preview.html in browser automatically (150ms debounce)
4. Displays live color palette and code samples
5. Opens browser automatically

### Output

```
🎨 Preview server started at http://localhost:5173
📝 Watching manifest.json for changes...
[Press Ctrl+C to stop]
```

### Examples

```bash
$ cd my-theme
$ themebooth preview
🎨 Preview server started at http://localhost:5173
📝 Watching manifest.json for changes...

# Edit manifest.json in another terminal
# Preview reloads automatically in browser

# Stop server
^C
```

### Port Fallback

If port 5173 is in use, Theme Booth automatically tries next available:
- 5173 (primary)
- 5174 (if in use)
- 5175 (if in use)
- ... up to 5183

No configuration needed—works automatically.

### Browser

Browser opens automatically at startup. If not:

1. Manually open: `http://localhost:5173`
2. Check firewall isn't blocking port 5173
3. Check console for errors (F12 DevTools)

### Code Samples

Preview includes samples in:
- JavaScript
- Python
- JSON
- HTML
- CSS

Tokens applied from `manifest.json` in real-time.

### Common Issues

**Port already in use:**
```
Error: bind EADDRINUSE
```
Solution: Auto-fallback to next port (no action needed) or kill existing process

**Hot-reload not working:**
1. Save manifest.json again (debounced 150ms)
2. Check manifest is valid JSON: `cat manifest.json | jq .`
3. Restart: Ctrl+C then `themebooth preview`

**Browser doesn't open:**
1. Manually navigate to `http://localhost:5173`
2. Check browser console (F12) for connection errors

---

## `themebooth package`

Package theme for all platforms (VS Code, Notepad++, Zed).

### Usage

```bash
themebooth package      # Packages all platforms
```

### Behavior

1. Validates `manifest.json`
2. Resolves color variables
3. Transpiles to editor-native formats:
   - VS Code: `theme.json`
   - Notepad++: `theme.xml`
   - Zed: `theme-zed.json`
4. Writes to `./.themebooth/output/{theme-name}/`
5. Generates `PUBLISH.md` with platform-specific instructions

### Output

```
📦 Packaging theme: "My Theme"
   ✅ VS Code (.json)
   ✅ Notepad++ (.xml)
   ✅ Zed (.json)
📁 Outputs written to: ./.themebooth/output/my-theme/
📖 See PUBLISH.md for marketplace submission steps
```

### Files Generated

```
.themebooth/output/my-theme/
├── theme.json              # VS Code theme
├── theme-zed.json          # Zed theme
├── theme.xml               # Notepad++ theme
├── manifest.json           # Original (reference)
└── PUBLISH.md             # Publishing instructions
```

### Examples

```bash
$ cd my-theme
$ themebooth package
📦 Packaging theme: "Ocean Dream"
   ✅ VS Code (.json)
   ✅ Notepad++ (.xml)
   ✅ Zed (.json)
📁 Outputs written to: ./.themebooth/output/ocean-dream/

$ ls ./.themebooth/output/ocean-dream/
theme.json  theme-zed.json  theme.xml  PUBLISH.md
```

### Validation

Package command validates:
- `manifest.json` exists and is valid
- All required fields present (name, author, version)
- All colors are valid hex format
- All variable references defined
- No circular variable dependencies
- All token properties whitelisted

Detailed error messages guide fixes.

### Common Issues

**No manifest.json found:**
```
Error: No manifest.json found
```
Solution: Run from theme directory with `manifest.json`

**Invalid manifest:**
```
Error: Invalid manifest: $undefined variable reference
```
Solution: Check error message and fix manifest.json

---

## `themebooth publish [platform]`

Publish theme to marketplace with interactive guidance.

### Usage

```bash
themebooth publish vscode       # Publish to VS Code Marketplace
themebooth publish notepad++    # Publish to Notepad++ Plugin Manager
themebooth publish zed          # Publish to Zed Theme Registry
```

### Platforms

| Platform | Marketplace | Flow | Status |
|----------|-------------|------|--------|
| `vscode` | VS Code Marketplace | Interactive | v1 ✅ |
| `notepad++` | Notepad++ Plugin Manager | Manual | v1 ✅ |
| `zed` | Zed Theme Registry | Interactive | v1 ✅ |

### VS Code Publishing

**Requirements:**
- Packaged output (run `themebooth package` first)
- VS Code Marketplace account
- Personal access token with "Publish" permissions

**Flow:**
1. Check for `vsce` CLI (suggests install if missing)
2. Prompt for personal access token
3. Validate theme format
4. Submit to VS Code Marketplace
5. Show marketplace link and version

**Example:**
```bash
$ cd my-theme
$ themebooth package
$ themebooth publish vscode
🔐 Enter VS Code personal access token: ••••••••••••••••••••
📤 Publishing to VS Code Marketplace...
✅ Published: "My Theme" v1.0.0
🔗 View at: https://marketplace.visualstudio.com/items?itemName=...
```

### Notepad++ Publishing

**Flow (Manual):**
1. Run: `themebooth package`
2. Get XML file from `./.themebooth/output/{theme}/theme.xml`
3. Follow on-screen instructions to submit to Plugin Manager
4. Includes checklist and submission template

**Example:**
```bash
$ cd my-theme
$ themebooth package
$ themebooth publish notepad++
📖 Notepad++ Publishing Guide
   1. Package your theme: ✅ Done
   2. Get theme.xml: ./.themebooth/output/my-theme/theme.xml
   3. Submit to Plugin Manager: https://plugins.notepad-plus-plus.org/
   4. Include manifest.json in submission
See PUBLISH.md for checklist
```

### Zed Publishing

**Requirements:**
- Packaged output (run `themebooth package` first)
- Zed registry account
- Registry authentication token

**Flow:**
1. Prompt for Zed registry credentials
2. Validate theme JSON format
3. POST to Zed registry API
4. Confirm publication
5. Show registry link

**Example:**
```bash
$ cd my-theme
$ themebooth package
$ themebooth publish zed
🔐 Enter Zed registry email: user@example.com
🔐 Enter Zed registry token: ••••••••••••••••••••
📤 Publishing to Zed Registry...
✅ Published: "My Theme" v1.0.0
🔗 View at: https://zed-registry.example.com/themes/my-theme
```

### Examples

```bash
# Full workflow: create → preview → package → publish
$ themebooth init my-theme
$ cd my-theme
$ themebooth preview  # Edit and test
# (Ctrl+C to stop preview)
$ themebooth package
$ themebooth publish vscode

# Publish to multiple platforms
$ themebooth publish zed
$ themebooth publish notepad++
```

### Common Issues

**Platform not supported:**
```
Error: Unknown platform "sublime"
```
Available: vscode, notepad++, zed

**No packaged output:**
```
Error: No packaged output found
```
Solution: Run `themebooth package` first

**VS Code token error:**
```
Error: Invalid token
```
Solution: Check token has "Publish" permission at https://dev.azure.com/

---

## Help Examples

```bash
# Show all commands
$ themebooth --help
Usage: themebooth [options] [command]

Options:
  -v, --version   output the version number
  -h, --help      display help for command

Commands:
  init [name]     Initialize a new theme project
  preview         Start live preview server
  package         Package theme for all platforms
  publish [platform]  Publish theme to marketplace
  help [command]  display help for command

# Show specific command help
$ themebooth init --help
Usage: themebooth init [options] [name]

Initialize a new theme project

Options:
  -p, --preset <preset>  Use a preset (dark, light, high-contrast) (default: "dark")
  -h, --help             display help for command

Examples:
  $ themebooth init my-theme
  $ themebooth init --preset light my-theme
  $ themebooth init  # Uses current directory name
```

## Tips

1. **Use variables**: Define colors once, reuse everywhere
   ```json
   {
     "variables": { "accent": "#007acc" },
     "colors": { "editor.foreground": "$accent" },
     "tokens": { "keyword": { "foreground": "$accent" } }
   }
   ```

2. **Test live**: Always use `preview` before packaging
   ```bash
   themebooth preview  # See changes instantly
   ```

3. **Validate early**: Errors caught at package time
   ```bash
   themebooth package  # Shows validation errors first
   ```

4. **Check examples**: See `MANIFEST_SCHEMA.md` for full reference

5. **Troubleshoot**: See `TROUBLESHOOTING.md` for solutions

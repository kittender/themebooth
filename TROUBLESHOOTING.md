# Troubleshooting

Solutions for common Theme Booth issues.

**Current Version**: v0.4.0 (2026-05-12)

## Installation

### `themebooth: command not found`

**Cause**: npm global bin directory not in PATH

**Solutions**:

1. Check global npm directory:
```bash
npm config get prefix
```

2. Add to PATH (e.g., in `~/.bashrc` or `~/.zshrc`):
```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

3. Reinstall globally:
```bash
npm install -g themebooth
```

### Permission denied when installing globally

**Cause**: npm permissions issue

**Solution** (use nvm):
```bash
curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
npm install -g themebooth
```

Or fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g themebooth
```

---

## Initialization

### `Directory already exists: my-theme`

**Cause**: `themebooth init my-theme` run in a directory that already exists

**Solutions**:

1. Use different directory name:
```bash
themebooth init my-theme-v2
```

2. Remove existing directory:
```bash
rm -rf my-theme
themebooth init my-theme
```

### Preset files not found

**Cause**: Presets not bundled in compiled `dist/` directory

**Solution**:

```bash
npm run build
```

Ensures presets are copied to `dist/templates/presets/`

---

## Preview Server

### Port 5173 already in use

**Cause**: Another process using port 5173

**Solutions**:

1. Let Theme Booth auto-fallback to next available port (automatic, no action needed)

2. Kill process on port 5173:
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

3. Specify different port (currently not supported, will be in v2):
   - Use auto-fallback feature (starts at 5173, tries 5174, 5175, etc.)

### Browser doesn't open automatically

**Cause**: Preview server started but browser didn't open

**Solutions**:

1. Manually open browser to `http://localhost:5173`

2. Check firewall isn't blocking:
```bash
# macOS
sudo lsof -i :5173
```

### Hot-reload not working

**Cause**: File watcher not detecting changes, or WebSocket connection dropped

**Solutions**:

1. Save manifest.json again (file watcher debounced 150ms)

2. Check manifest.json is valid JSON:
```bash
cat manifest.json | jq .
```

3. Restart preview server:
```bash
# Ctrl+C
themebooth preview
```

4. Check browser console for WebSocket errors (F12 DevTools)

---

## Manifest Validation

### Validating your manifest

**Best practice**: Use `themebooth validate` before packaging:

```bash
themebooth validate              # Check for errors and warnings
themebooth validate --fix        # Auto-fix color format issues
themebooth validate --ci         # CI/CD output (JSON)
```

The validate command checks:
- Required fields (name, author, version, etc.)
- Color formats and variable references
- Circular dependencies
- Token properties
- Computed colors
- Theme inheritance (extends)
- Export compatibility

---

### `Invalid manifest: Missing required field 'name'`

**Cause**: Required field missing from manifest.json

**Solution**: Run `themebooth validate` to identify missing fields, then add:
```json
{
  "name": "My Theme",
  "author": "Your Name",
  "description": "Theme description",
  "version": "1.0.0",
  "variables": {},
  "colors": {},
  "tokens": {}
}
```

### `Invalid color format: #gg00ff`

**Cause**: Invalid hex color (must be #rrggbb or #rgb)

**Solution**: Use valid hex colors:
```json
{
  "variables": {
    "bad": "#gg00ff",      // ❌ Invalid (g is not hex)
    "good": "#00ff00",     // ✅ Valid 6-digit
    "short": "#0f0"        // ✅ Valid 3-digit shorthand
  }
}
```

### `Circular variable dependency: a → b → a`

**Cause**: Variables reference each other in a loop

**Solution**: Break the cycle:
```json
{
  "variables": {
    "a": "$b",     // ❌ Circular
    "b": "$a"      // ❌ Circular
  }
}
```

Fix by removing reference:
```json
{
  "variables": {
    "a": "#ff0000",
    "b": "#00ff00"
  }
}
```

### `Undefined variable reference: $unknown`

**Cause**: Variable referenced but not defined

**Solution**: Define the variable:
```json
{
  "variables": {
    "accent": "#007acc"  // Add this
  },
  "colors": {
    "editor.foreground": "$accent"
  }
}
```

### `Invalid token property: fontSize`

**Cause**: Token property not in whitelist

**Valid token properties**:
- `foreground` - Text color
- `background` - Background color
- `fontStyle` - "bold", "italic", or "underline"
- `fontWeight` - "100"-"900"
- `opacity` - 0-1

**Solution**:
```json
{
  "tokens": {
    "keyword": {
      "foreground": "#007acc",      // ✅
      "fontStyle": "bold",          // ✅
      "fontSize": "14px"            // ❌ Not supported
    }
  }
}
```

### `Computed color transform failed`

**Cause**: Invalid base color or transform parameters

**Valid transforms**: `darken`, `lighten`, `alpha`
**Valid amount**: 0-100 (percentage)
**Valid base**: hex color (#rrggbb) or variable reference ($variableName)

**Solution**:
```json
{
  "computed": {
    "color_dark": {
      "base": "$accent",         // ✅ Valid variable reference
      "transform": "darken",     // ✅ Valid transform
      "amount": 20               // ✅ Valid amount (0-100)
    },
    "bad_example": {
      "base": "#gggggg",        // ❌ Invalid hex
      "transform": "shadow",    // ❌ Invalid transform
      "amount": 150             // ❌ Invalid amount (>100)
    }
  }
}
```

### `Theme inheritance: Circular extends detected`

**Cause**: Manifests form a cycle (A → B → A)

**Solution**: Check the `extends` chain:
```json
{
  "extends": "./theme-a.json"   // theme-a.json extends theme-b.json
}
// theme-b.json extends ./theme-a.json  ❌ Cycle detected
```

Fix by breaking the cycle:
```json
{
  "extends": "./base-theme.json"  // ✅ Points to unrelated base
}
```

### `Cannot resolve theme extends path`

**Cause**: `extends` path invalid or relative path not resolved

**Solution**: Use correct relative path:
```json
{
  "extends": "../parent/manifest.json"  // ✅ Relative to current manifest
}
// NOT:
{
  "extends": "/absolute/path/manifest.json"  // ❌ Absolute paths not supported
}
```

---

## Presets

### `Preset wizard (themebooth preset add) hangs`

**Cause**: Input not being read from stdin

**Solution**:
```bash
# Make sure you're running interactively
themebooth preset add   # ✅

# Not in non-interactive context
echo "n" | themebooth preset add   # ❌ May fail
```

### `Invalid preset name or values`

**Cause**: Preset name contains invalid characters or color values invalid

**Solution**: Preset names auto-converted to snake_case:
```json
{
  "presets": {
    "my preset":      // ✅ Converted to "my_preset"
    "Dark-Bold":      // ✅ Converted to "dark_bold"
    "123invalid":     // ⚠️ Allowed but unconventional
  }
}
```

Values must be valid colors or `$variable` references:
```json
{
  "presets": {
    "dark": {
      "variableOverrides": {
        "bg": "#000000",        // ✅ Valid hex
        "accent": "$base_color" // ✅ Valid variable reference
      }
    }
  }
}
```

---

## Semantic and Language-Specific Tokens

### `Semantic tokens not applying`

**Cause**: Editor may not support semantic tokens, or token name not recognized

**Solution**: Use standard token names:
```json
{
  "semanticTokens": {
    "variable": { "foreground": "#569cd6" },        // ✅ Standard
    "function.builtin": { "foreground": "#ce9178" } // ✅ Standard
    "custom_unknown": { "foreground": "#fff" }      // ⚠️ May not work
  }
}
```

### `Language-specific tokens not applying`

**Cause**: Language not detected correctly, or language code incorrect

**Supported languages**: javascript, python, java, css, html, xml, and others matching VS Code language identifiers

**Solution**: Use correct language identifiers:
```json
{
  "languageTokens": {
    "python": { },          // ✅ Correct
    "py": { },              // ❌ Wrong (should be "python")
    "js": { },              // ❌ Wrong (should be "javascript")
    "javascript": { },      // ✅ Correct
    "typescript": { },      // ✅ Correct
  }
}
```

---

## Packaging

### `No manifest.json found`

**Cause**: Not in theme project directory

**Solution**: Navigate to theme project:
```bash
cd my-theme
themebooth package
```

### Package command hangs

**Cause**: Large manifest or slow system

**Solutions**:

1. Wait a bit longer (usually completes in <1s)

2. Check manifest.json for issues:
```bash
cat manifest.json | jq .
```

3. Restart and try again:
```bash
# Ctrl+C
themebooth package
```

### Generated files look corrupted

**Cause**: Export format issue

**Solution**: Check compiled output:
```bash
# Check VS Code export
cat .themebooth/output/my-theme/theme.json | jq .

# Check Zed export
cat .themebooth/output/my-theme/theme-zed.json | jq .

# Check Notepad++ export
cat .themebooth/output/my-theme/theme.xml
```

---

## Publishing

### `Platform not supported`

**Cause**: Requesting unsupported platform

**Supported platforms**: vscode, notepad++, zed, sublime

**Solution**:
```bash
themebooth publish vscode      # ✅
themebooth publish notepad++   # ✅
themebooth publish zed         # ✅
themebooth publish sublime     # ✅
```

### VS Code publish fails with token error

**Cause**: Missing or invalid VS Code personal access token

**Solutions**:

1. Create token: https://dev.azure.com/

2. Ensure token has:
   - `Marketplace (Publish)`
   - `Marketplace (Manage)` 
   - Expiration: far future or infinite

3. Re-run publish command

### Notepad++ publish guide not showing

**Cause**: Notepad++ publish is manual-only in v1

**Solution**: Follow on-screen instructions to:
1. Package theme: `themebooth package`
2. Get XML file from output
3. Submit to Notepad++ Plugin Manager manually

---

## General

### Strange colors in preview or exported theme

**Cause**: Variable interpolation issue

**Solution**: Verify variables resolve correctly:
```bash
# Add debug output to manifest.json temporarily
# Check which variables are defined and their values
cat manifest.json | jq '.variables'
```

### Performance issues / slow operations

**Cause**: Large manifest or many tokens

**Solution**:

1. Check file watcher debounce (150ms minimum)
2. Reduce number of token definitions if possible
3. Use variables to minimize duplicate definitions

### Still having issues?

1. Check error message carefully—includes line/column info
2. Validate manifest.json against schema: `MANIFEST_SCHEMA.md`
3. Review examples in `README.md`
4. Open GitHub issue with:
   - Error message (exact text)
   - Your manifest.json (sanitize if needed)
   - Steps to reproduce
   - Node version: `node --version`
   - OS: `uname -a` (macOS/Linux) or `systeminfo` (Windows)

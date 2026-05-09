# CLI UX Improvement Plan

## Overview

Enhance Theme Booth CLI with early validation, debugging tools, and quality checks. Move error detection from runtime (package/publish) to design time (validate). Add auto-conversion for CSS color formats.

## Core Problems Addressed

1. **Late error detection**: Errors only surface during `themebooth package`, wasting time
2. **Opaque failures**: Circular extends, undefined variables, invalid colors hidden until build time
3. **Poor iteration**: No way to test single exporter or validate before commit
4. **Silent mistakes**: Unused variables, naming inconsistencies, broken presets undetected
5. **Format inflexibility**: Only hex colors accepted; RGB/RGBA/HSL require manual conversion

---

## Features

### 1. `themebooth validate` — Early Validation (PRIORITY: 1)

Dry-run all manifest checks before packaging. Catches errors at edit time.

#### Implementation

**Input**: `manifest.json` + `extends` chain (if present)

**Validation layers** (in order):

1. **File existence & format**
   - `manifest.json` exists
   - Valid JSON syntax
   - Report line:column on parse errors

2. **Schema compliance**
   - Required fields: `name`, `author`, `description`, `version`, `variables`, `colors`, `tokens`
   - Field types correct (string, object, array)
   - No unknown top-level fields (warn on typos: "did you mean `tokens`?")

3. **Variables**
   - All keys are valid identifiers (snake_case recommended)
   - No circular dependencies: `a → $b → $a`
   - No undefined refs: `"color": "$undefined"`
   - Warn on unused variables (defined but never referenced)

4. **Colors**
   - Parse and normalize color formats:
     - Hex: `#rgb`, `#rrggbb`, `#rgba`, `#rrggbbaa` ✅
     - RGB: `rgb(255, 0, 0)` → convert to `#ff0000`
     - RGBA: `rgba(255, 0, 0, 0.5)` → convert to `#ff000080`
     - HSL: `hsl(0, 100%, 50%)` → convert to hex
     - Named: `red` → convert to `#ff0000`
     - Variables: `$accent` (resolve after variables validated)
   - Invalid formats: report with suggestion
   - Auto-convert valid non-hex to hex, report changes

5. **Computed colors**
   - Base exists and resolves (variable or hex)
   - Transform in whitelist: `darken`, `lighten`, `alpha`
   - Amount valid: 0–100 (percentage)
   - Test transform (dry-run color math)

6. **Tokens**
   - Properties in whitelist: `foreground`, `background`, `fontStyle`, `fontWeight`, `opacity`
   - Color values parse correctly (hex or `$variable`)
   - Font styles in set: `bold`, `italic`, `underline`
   - Font weights valid: `100`–`900` or named (`normal`, `bold`)
   - Opacity in range: 0–1

7. **Semantic & language tokens**
   - Same validation as tokens
   - Language codes match VS Code registry (javascript, python, java, …)
   - Token names match known semantic token scopes

8. **Presets**
   - Names valid identifiers
   - Variable overrides resolve to valid colors
   - No preset references undefined variables

9. **Theme inheritance (extends)**
   - `extends` path resolves (relative to manifest location)
   - No circular chains: `a → b → c → a`
   - Inherited manifest valid recursively
   - Merge inheritance chain correctly

10. **Dry-run exporter validation**
    - VS Code: colors/tokens convertible to JSON
    - Zed: colors/tokens convertible to JSON
    - Notepad++: all colors convertible to Notepad++ XML format

#### Output

```
✓ manifest.json valid
  • All colors converted: rgb(255,0,0) → #ff0000
  • 15 variables, 42 tokens, 3 presets, 0 extends
  • No issues

✗ manifest.json invalid (4 errors, 2 warnings)

  ERROR [line 15, col 8]: Circular variable dependency
    $accent → $primary → $accent
    Fix: Break the reference cycle

  ERROR [line 28]: Invalid color format "#gggggg"
    Did you mean: #999999?
    Or use: rgb(153, 153, 153)

  ERROR [line 42]: Undefined variable $secondary
    Referenced in: colors.editor.accent
    Defined variables: accent, primary, background

  ERROR [line 51]: Invalid extends path "./themes/base.json"
    File not found at: /path/to/themes/base.json

  WARNING [line 30]: Unused variable $debug_pink
    Defined but never referenced. Safe to remove.

  WARNING [line 45]: Token property fontSize not supported
    Will be ignored in all editors.
```

#### Exit codes
- `0`: Valid, ready to package
- `1`: Invalid, cannot package
- `2`: Valid with warnings (can package but not recommended)

#### CLI

```bash
themebooth validate                # Check current directory's manifest.json
themebooth validate ./custom.json  # Check specific manifest
themebooth validate --fix          # Auto-convert colors, write back manifest
themebooth validate --ci           # Machine-readable JSON output for CI
```

#### Color Conversion Logic

Auto-convert supported CSS color formats to hex. Maintains accuracy for transparency (alpha).

```javascript
// parseAndNormalizeColor(input) → { hex: string, changes: string[] }
// Returns normalized hex + list of changes made

parseAndNormalizeColor("rgb(255, 0, 0)")
  // → { hex: "#ff0000", changes: ["Converted from rgb(255, 0, 0)"] }

parseAndNormalizeColor("rgba(255, 0, 0, 0.5)")
  // → { hex: "#ff000080", changes: ["Converted from rgba(255, 0, 0, 0.5)"] }

parseAndNormalizeColor("red")
  // → { hex: "#ff0000", changes: ["Converted from named color 'red'"] }

parseAndNormalizeColor("#ff0000")
  // → { hex: "#ff0000", changes: [] } // Already hex

parseAndNormalizeColor("hsl(0, 100%, 50%)")
  // → { hex: "#ff0000", changes: ["Converted from hsl(0, 100%, 50%)"] }

parseAndNormalizeColor("#gggggg")
  // → null // Invalid, can't convert
```

With `--fix` flag, report conversions:
```
✓ manifest.json fixed (2 conversions)
  • Line 15: rgb(255,0,0) → #ff0000
  • Line 42: rgba(0,255,0,0.5) → #00ff0080
  Written back to manifest.json
```

---

### 2. `themebooth doctor` — Health Check (PRIORITY: 2)

Quick scan before preview/package. Detects common structural issues.

#### Checks

1. **Files**
   - `manifest.json` readable
   - `preview.html` exists (for preview)
   - Package output directory writable

2. **Manifest completeness**
   - Required top-level fields present
   - `variables` object not empty (warn if no variables defined)
   - `colors` object not empty
   - `tokens` object not empty

3. **Presets validity**
   - Each preset has valid name
   - `variableOverrides` reference defined variables
   - No preset self-references

4. **Extends chain**
   - No broken paths
   - No circular chains (recursive check)

5. **Node/npm version**
   - Node ≥ 18 (for TypeScript, async/await support)
   - npm available

#### Output

```
✓ All systems go!
  • manifest.json: valid
  • Node 18.16.0: supported
  • npm 9.5.0: available
  • 3 presets defined
  • Ready for preview or package

✗ Issues found (1 error, 2 warnings)
  ERROR: Preset "dark_variant" references undefined variable $button_color
  WARNING: manifest.json has no description
  WARNING: Node 16.x detected; recommend upgrading to 18+
```

#### CLI

```bash
themebooth doctor              # Quick scan
themebooth doctor --verbose    # Detailed output with recommendations
```

---

### 3. `themebooth export <format>` — Single Exporter (PRIORITY: 3)

Test individual exporter without full packaging. Useful for debugging format-specific issues.

#### Implementation

Reuse existing exporter code (from `package` command), but:
- Export only one format
- Write to `.themebooth/export/{format}/` (temp location)
- Fast feedback loop for iterating

#### Formats

- `vscode` → `theme.json`
- `zed` → `theme.json`
- `notepad++` → `theme.xml`

#### Output

```
✓ Exported to .themebooth/export/vscode/theme.json (2.4 KB)
  Ready to install manually:
  cp theme.json ~/.config/Code/User/extensions/my-theme-1.0.0

✗ Export failed
  ERROR: Invalid color in token.keyword: $undefined_variable
  Fix: Define $undefined_variable in manifest.variables
```

#### CLI

```bash
themebooth export vscode           # Export to .themebooth/export/vscode/
themebooth export zed
themebooth export notepad++
themebooth export all              # Export all three (alias for package output)
```

---

### 4. `themebooth lint` — Quality Checks (PRIORITY: 4)

Style and consistency linting. Optional but catches rookie mistakes.

#### Checks

1. **Naming conventions**
   - Variables should be snake_case (warn on camelCase, PascalCase)
   - Suggest `error` instead of `red` (semantic naming)
   - Flag variables with unclear names: `x`, `foo`, `temp`

2. **Unused definitions**
   - Variables never referenced
   - Token rules that overlap without clear purpose
   - Presets that override no variables

3. **Consistency**
   - Color usage: is `$bg` used for all backgrounds?
   - Token properties: are all keywords bold? (suggest consistent rules)
   - Suggest grouping similar tokens

4. **Completeness**
   - All major token categories covered: keyword, string, comment, function, variable
   - Warn if > 10 presets (suggest consolidation)
   - Check for missing editor colors (editor.background, editor.foreground, …)

5. **Performance**
   - Warn if > 100 computed colors (can slow transpilation)
   - Suggest reusing variables instead of duplication

#### Output

```
⚠ 5 style issues found (lint, not errors)

  SUGGESTION [line 12]: Variable name unclear
    "fg" should be "foreground" or "text_color"
    Makes manifest more maintainable

  SUGGESTION [line 45]: Unused variable $debug_teal
    Defined but never referenced
    Remove if not needed, or use in a token

  SUGGESTION: Missing token rule for "type" scope
    Most themes style `type` differently from `keyword`
    Consider adding to tokens section

  SUGGESTION: All keywords are bold, but not all functions
    Consider consistent fontStyle rule

  SUGGESTION: Preset "light_soft" overrides only 1 variable
    May not provide meaningful variant. Worth keeping?

Run: themebooth lint --fix  (auto-fix some suggestions)
```

#### CLI

```bash
themebooth lint                # Report suggestions
themebooth lint --fix          # Auto-fix naming conventions
themebooth lint --strict       # Treat suggestions as errors (exit 1)
```

---

### 5. `--dry-run` & `--ci` Flags (PRIORITY: 3)

#### `themebooth package --dry-run`
- Validate all
- Show what files would be created (names, sizes, format)
- Don't write output
- Report all errors upfront

```bash
$ themebooth package --dry-run
✓ Validation passed
  Would create:
  • .themebooth/output/my-theme/theme.json (2.4 KB) [VS Code]
  • .themebooth/output/my-theme/theme-zed.json (2.1 KB) [Zed]
  • .themebooth/output/my-theme/theme.xml (3.8 KB) [Notepad++]
  • .themebooth/output/my-theme/package.json (0.6 KB) [Metadata]
  Total: 9.0 KB across 4 files
```

#### `themebooth publish --dry-run`
- Check all publishing prerequisites (no token submission)
- Validate packaged output exists
- Check marketplace connectivity
- Report what would be submitted

```bash
$ themebooth publish vscode --dry-run
✓ Prerequisites met
  • VS Code extension: my-theme-1.0.0
  • Manifest: valid
  • Theme file: exists, valid JSON
  • Publisher token: configured and valid
  Ready to publish with: themebooth publish vscode
```

#### `--ci` Flag
Machine-readable output (JSON) for CI/CD integration:

```bash
themebooth validate --ci | jq .
{
  "valid": true,
  "errors": [],
  "warnings": [
    { "line": 30, "field": "variables.debug_pink", "message": "Unused variable" }
  ],
  "stats": {
    "variables": 15,
    "tokens": 42,
    "presets": 3,
    "extends": 0
  }
}
```

---

### 6. Better Error Messages (PRIORITY: 2)

#### Current state
```
ERROR: Undefined variable reference: $unknown
```

#### Improved state
```
ERROR [line 28, col 12]: Undefined variable reference
  colors.editor.accent = "$unknown"
                          ^^^^^^^^
  Available variables: accent, primary, background, text_color
  Did you mean: $accent?

  Fix: Either define $unknown in variables, or use an existing variable.
```

#### Implementation

- Include manifest line:column in all error messages
- Show code context (2 lines before/after)
- List available options (defined variables, valid token properties, …)
- Suggest closest match (Levenshtein distance) for typos
- Add links to docs (e.g., "Learn more: https://…/manifest-schema.md#colors")

---

## Implementation Strategy

### Phase 1: Foundation (Validate)
1. Extract validation logic into reusable module (`src/core/validation.ts` already started)
2. Implement color parsing/normalization
3. Build validate command
4. Add `--fix` flag for auto-conversion
5. Test with real manifests (dark/light/high-contrast presets)

**Outcome**: Early error detection, color format flexibility

### Phase 2: Debugging (Export, Doctor)
1. Export command: reuse exporter code, single-format mode
2. Doctor command: quick structural scan
3. Add `--dry-run` and `--ci` flags to package/publish
4. Improve error messages with context

**Outcome**: Faster iteration, debuggable exports, CI/CD ready

### Phase 3: Polish (Lint, Better Messages)
1. Lint rules for naming, unused definitions, coverage
2. Enhanced error messages with suggestions
3. Docs update with new commands
4. Help text for each command

**Outcome**: Quality assurance, better UX

---

## File Changes

### New files
- `src/cli/validate.ts` — Validate command implementation
- `src/cli/doctor.ts` — Doctor command implementation
- `src/cli/export.ts` — Export command implementation
- `src/cli/lint.ts` — Lint command implementation
- `src/core/colors.ts` — Color parsing and conversion utilities
- `src/core/validation-enhanced.ts` — Advanced validation logic
- `tests/validate.test.ts` — Validate command tests
- `tests/colors.test.ts` — Color conversion tests

### Modified files
- `src/bin/themebooth.ts` — Register new commands
- `src/utils/validation.ts` — Enhance error reporting
- `src/utils/logger.ts` — Support colored, contextual output
- `CLI_HELP.md` — Document new commands
- `README.md` — Update quickstart with validate step

---

## Success Criteria

- [ ] `themebooth validate` catches all schema errors
- [ ] Color conversion handles RGB, RGBA, HSL, named colors
- [ ] Errors include line:column and code context
- [ ] `themebooth export` produces output in < 500ms
- [ ] `--dry-run` prevents accidental writes
- [ ] CI integration works with `--ci` flag (JSON output)
- [ ] All existing tests pass
- [ ] New features documented in CLI_HELP.md
- [ ] No breaking changes to existing commands

---

## Example Workflows

### Workflow 1: Before packaging
```bash
$ themebooth validate
✓ manifest.json valid, 2 colors converted

$ themebooth doctor
✓ All systems go!

$ themebooth package
# Proceed with confidence
```

### Workflow 2: Debugging a specific editor
```bash
$ themebooth export vscode
✓ Exported to .themebooth/export/vscode/theme.json

# Test in VS Code, then iterate:
$ vim manifest.json
$ themebooth export vscode  # Fast feedback
# Repeat until happy

$ themebooth package  # Full export
```

### Workflow 3: CI/CD validation
```bash
$ themebooth validate --ci | jq '.valid'
true
$ themebooth package --dry-run
# Ensures all checks pass before publishing pipeline
```

### Workflow 4: Quality check before commit
```bash
$ themebooth lint
⚠ 3 suggestions (variable naming, unused definition)

$ themebooth lint --fix
✓ Fixed naming: fg → foreground, bg → background

$ git add manifest.json
$ git commit -m "refactor: improve manifest readability"
```

---

## Future Enhancements (v2+)

- Watch mode for validate/lint (real-time feedback as you edit)
- Import themes from VS Code extensions
- Diff between theme versions
- Merge multiple manifests
- Sync presets across team (shared preset library)
- Performance profiling (which tokens are slowest to transpile?)

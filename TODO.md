# Themebooth MVP Refactor: Software-Agnostic Manifest + Editor-Specific Overrides

## Problem Statement

Current manifest.json captures ~15% of theme rules from Brackets (CodeMirror/LESS). Root cause: format incompatibility.

**Gap**: manifest.json is VS Code-centric. Missing:
- Language-specific token rules (XML tags, CSS properties, JS async/await)
- Editor UI customization (scrollbars, buttons, tabs, line numbers)
- Visual effects (shadows, borders, opacity)
- Decorative elements (icons, emojis)
- Software-specific styling details

**Solution**: Separate concerns into core + overrides:
1. **manifest.json** - Software-agnostic color palette + generic token definitions
2. **{editor}.json** - Editor-specific customizations (vscode.json, brackets.json, sublime.json, etc.)

---

## MVP Goals (Phase 1)

1. **Define manifest.json structure** for cross-editor compatibility
   - Core sections: variables, tokens, semantic tokens, presets
   - No editor-specific keys (no `editor.background`, `tab.activeBackground`, etc.)
   
2. **Create editor-specific overlay format**
   - Each editor gets its own JSON file: `vscode.json`, `brackets.json`, `sublime.json`, etc.
   - Inherits from manifest.json base colors
   - Adds editor-specific keys (UI, effects, language rules)

3. **Define inheritance & override rules**
   - Software files can reference manifest variables
   - Software files can extend/override tokens
   - Clear precedence: manifest base → software override → preset override

---

## Detailed MVP Plan

### 1. Refactor manifest.json (Core Theme Definition)

**Keep these sections:**
- `variables` - Color palette (no computed values, hex only)
- `tokens` - Generic syntax token rules (language-agnostic)
- `semanticTokens` - Modifier-based rules (deprecated, readonly, etc.)
- `presets` - Variants (high-contrast, light mode) that only override variables

**Remove/Move these:**
- `colors` → move to `vscode.json`
- `languageTokens` → extend in software-specific files

**New structure:**
```json
{
  "name": "theme-name",
  "variables": { ... },
  "tokens": {
    "comment": { "foreground": "...", "fontStyle": "..." },
    "keyword": { ... },
    ...
  },
  "semanticTokens": {
    "*.deprecated": { ... },
    ...
  },
  "presets": {
    "highContrast": { "overrides": { ... } },
    "lightMode": { "overrides": { ... } }
  }
}
```

### 2. Create Editor-Specific Files

#### vscode.json
```json
{
  "inherits": "../manifest.json",
  "colors": {
    "editor.background": "$color-bg-primary",
    "editor.foreground": "$color-fg-primary",
    "tab.activeBackground": "$color-bg-primary",
    ...
  },
  "tokenOverrides": {
    "comment": { "background": "..." },
    ...
  },
  "languageTokens": {
    "javascript": { "keyword.async": { ... } },
    ...
  }
}
```

#### brackets.json
```json
{
  "inherits": "../manifest.json",
  "less": {
    ".cm-m-xml .cm-tag": { "color": "..." },
    ".cm-m-css .cm-property": { ... },
    ...
  },
  "decorativeElements": {
    "activeLineSparkle": "✨",
    "errorIcon": "☠",
    ...
  },
  "visualEffects": {
    "boxShadow": "0 2px 8px rgba(0,0,0,0.3)",
    "borders": { ... },
    ...
  }
}
```

#### sublime.json, vim.json, etc.
Similar structure, adapted to each editor's theming API.

### 3. Build Process Changes

- **Input**: manifest.json + {editor}.json files
- **Processing**:
  1. Load manifest.json base colors
  2. Load editor-specific file
  3. Resolve variable references (`$color-...`)
  4. Apply preset overrides if specified
  5. Merge software-specific sections
- **Output**: 
  - Pre-computed JSON per editor (no variables, all hex)
  - For Brackets: compile to LESS (interpolate colors into selectors)
  - For VS Code: native theme file

### 4. Variable Inheritance & Resolution

Manifest defines variable namespace:
```json
"variables": {
  "color-bg-primary": "#1e1e1e",
  "color-semantic-keyword": "#569cd6"
}
```

Software files can reference:
```json
"colors": {
  "editor.background": "$color-bg-primary",
  "editor.foreground": "$color-fg-primary"
}
```

Resolver expands `$color-*` → hex values before output.

### 5. Presets Implementation

Current presets in manifest only override variables. Enhanced:
```json
"presets": {
  "highContrast": {
    "description": "Higher contrast variant",
    "variableOverrides": {
      "color-fg-secondary": "#a8a8a8"
    },
    "tokenOverrides": {
      "comment": { "foreground": "#888888" }
    },
    "softwareOverrides": {
      "vscode": { "editor.lineHighlightBackground": "#3f3f4d66" }
    }
  }
}
```

---

## Implementation Phases

### Phase 1 MVP (Current Sprint)
- [x] Identify structure
- [x] Refactor manifest.json (remove editor-specific colors)
- [x] Create vscode.json with all VS Code color keys
- [x] Create brackets.json with LESS rules + decorative elements
- [x] Implement resolver (variable expansion)
- [x] Test with one theme (90s-tshirt)

### Phase 2 (Follow-up)
- [x] Add build process to generate pre-computed outputs (transpileTheme)
- [x] Create sublime.json, vim.json, atom.json templates (exporters/)
- [x] Implement preset overrides at build time (applyPresetOverrides)
- [x] Add validation schema for each file type (schemas.ts)

### Phase 3 (Complete ✅)
- [x] Task 1: Export Preset type + computedEntrySchema (manifest.ts)
- [x] Task 2: Fix manifest.schema.json (presets array→object, add extends/computed)
- [x] Task 3: Theme inheritance - deepMergeManifests, resolveInheritance (inheritance.ts)
- [x] Task 4: Wire inheritance into transpiler
- [x] Task 5: Computed colors - applyColorTransform, resolveComputedColors (computed.ts)
- [x] Task 6: Wire computed colors into transpiler
- [x] Task 7: Preset wizard CLI (preset.ts)
- [x] Task 8: Register preset add command (themebooth.ts)
- [x] Task 9: Tests (inheritance, computed, preset) - 130 tests passing

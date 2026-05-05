# Theme Manifest Schema

The theme manifest is a JSON file that defines your syntax theme. This document describes all available fields and how to use them.

## File Location

Your manifest should be at the root of your theme project:
```
my_theme/
├── manifest.json          # Your theme definition
├── preview.html           # Generated preview
└── .themebooth/
    └── cache/
```

## Basic Structure

```json
{
  "name": "Ocean Dream",
  "description": "A cool ocean-inspired syntax theme",
  "author": "John Doe",
  "version": "1.0.0",
  "variables": { },
  "colors": { },
  "tokens": { }
}
```

## Fields

### Required Fields

#### `name` (string)
Theme name displayed in editor marketplaces.
```json
"name": "Ocean Dream"
```

#### `author` (string)
Creator of the theme.
```json
"author": "John Doe"
```

#### `version` (string)
Semantic version (Major.Minor.Patch).
```json
"version": "1.0.0"
```

### Optional Fields

#### `description` (string)
Short description of the theme.
```json
"description": "A cool ocean-inspired syntax theme"
```

#### `presets` (array)
Built-in presets to extend from: `["dark", "light", "high-contrast"]`.
```json
"presets": ["dark"]
```

## Variables

Define reusable color variables that can be referenced throughout your theme.

### Definition

```json
"variables": {
  "primaryBg": "#0d1117",
  "primaryFg": "#c9d1d9",
  "accent": "#58a6ff"
}
```

### Rules

- Variable names must be alphanumeric: `^[a-zA-Z_]\w*$`
- Values must be hex colors: `#RRGGBB` or `#RGB`
- Variables can reference other variables (transitive):
  ```json
  "variables": {
    "base": "#ff0000",
    "derived": "$base"  // Resolves to #ff0000
  }
  ```
- **Circular references are not allowed** and will cause validation errors

### Example

```json
"variables": {
  "bg": "#1e1e1e",
  "fg": "#d4d4d4",
  "accent": "#007acc",
  "keyword": "#569cd6",
  "string": "#ce9178",
  "comment": "#6a9955"
}
```

## Colors

Define editor UI colors like background, foreground, line numbers, etc.

### Format

```json
"colors": {
  "editor.background": "#1e1e1e",
  "editor.foreground": "#d4d4d4",
  "editor.lineNumberActiveForeground": "#007acc",
  "editor.selectionBackground": "#264f78"
}
```

### Using Variables

```json
"colors": {
  "editor.background": "$bg",
  "editor.foreground": "$fg",
  "editor.lineNumberActiveForeground": "$accent"
}
```

### Common Color Properties

- `editor.background` - Editor background color
- `editor.foreground` - Default text color
- `editor.lineNumberActiveForeground` - Active line number color
- `editor.selectionBackground` - Selection background color
- `editor.wordHighlightBackground` - Word highlight background
- `editorCursor.foreground` - Cursor color
- `editorWhitespace.foreground` - Whitespace character color

Platform-specific exporters map these to editor-native formats automatically.

## Tokens

Define syntax highlighting rules for code elements.

### Format

```json
"tokens": {
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
  }
}
```

### Token Properties

- **`foreground`** - Text color (#RRGGBB, #RGB, or $variable)
- **`background`** - Background color (#RRGGBB, #RGB, or $variable)
- **`fontStyle`** - Font style (normal, italic, oblique)
- **`fontWeight`** - Font weight (normal, bold, lighter, bolder, or 100-900)
- **`opacity`** - Opacity value (0.0 to 1.0)

### Common Token Scopes

These scopes are supported across all platforms:

- `keyword` - Language keywords (if, for, function, etc.)
- `string` - String literals
- `string.quoted` - Quoted strings
- `comment` - Comments
- `number` - Numeric literals
- `constant.builtin` - Built-in constants (true, false, null, etc.)
- `variable` - Variable names
- `variable.parameter` - Function parameters
- `punctuation` - Punctuation marks
- `operator` - Operators (+, -, *, /, etc.)
- `entity.name.function` - Function names
- `entity.name.class` - Class names
- `invalid` - Invalid syntax

### Variable References in Tokens

```json
"tokens": {
  "keyword": {
    "foreground": "$keyword"
  },
  "string": {
    "foreground": "$string"
  }
}
```

## Validation

When you run `themebooth package` or `themebooth preview`, your manifest is validated:

### Checks

1. All required fields present
2. Semver version format
3. Valid hex colors (#RRGGBB or #RGB)
4. All variable references exist
5. No circular variable dependencies
6. Token properties from whitelist

### Error Messages

If validation fails, you'll see detailed errors:

```
Validation Error
  • variables.myColor: Invalid hex color format. Use #RRGGBB or #RGB
  • colors.editor.background: Undefined variable reference: $undefined
  • tokens.keyword: Circular variable reference: $a → $b → $a
```

## JSON Schema

The manifest includes a `$schema` field for IDE autocomplete:

```json
{
  "$schema": "https://themebooth.dev/schema/manifest.json",
  "name": "My Theme",
  ...
}
```

This enables:
- Autocomplete for properties
- Type validation
- Documentation hints
- Inline error detection

## Complete Example

```json
{
  "$schema": "https://themebooth.dev/schema/manifest.json",
  "name": "Ocean Dream",
  "description": "A cool ocean-inspired syntax theme",
  "author": "John Doe",
  "version": "1.0.0",
  "variables": {
    "bg": "#0d1117",
    "fg": "#c9d1d9",
    "accent": "#58a6ff",
    "keyword": "#ff7b72",
    "string": "#a371f7",
    "comment": "#8b949e",
    "number": "#79c0ff",
    "builtin": "#79c0ff"
  },
  "colors": {
    "editor.background": "$bg",
    "editor.foreground": "$fg",
    "editor.lineNumberActiveForeground": "$accent",
    "editor.selectionBackground": "#3d444d",
    "editor.wordHighlightBackground": "#3d444d",
    "editorCursor.foreground": "$accent",
    "editorWhitespace.foreground": "#30363d"
  },
  "tokens": {
    "keyword": {
      "foreground": "$keyword",
      "fontStyle": "bold"
    },
    "string": {
      "foreground": "$string"
    },
    "comment": {
      "foreground": "$comment",
      "fontStyle": "italic"
    },
    "number": {
      "foreground": "$number"
    },
    "constant.builtin": {
      "foreground": "$builtin"
    }
  },
  "presets": []
}
```

## Tips

1. **Start simple** - Begin with basic colors and expand
2. **Use variables** - Makes maintenance and consistency easier
3. **Reference values** - Transitive variables (e.g., `base` → `primary` → `text`)
4. **Test colors** - Use `themebooth preview` to see live updates
5. **WCAG Contrast** - Aim for AA minimum contrast (4.5:1 for text)

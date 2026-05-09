# Theme Manifest Schema

Complete reference for the `manifest.json` configuration file.

## Structure

```json
{
  "name": "String",
  "author": "String",
  "description": "String",
  "version": "String",
  "variables": {
    "variableName": "#rrggbb"
  },
  "colors": {
    "editor.property": "#rrggbb or $variable"
  },
  "tokens": {
    "tokenType": {
      "foreground": "#rrggbb or $variable",
      "background": "#rrggbb or $variable",
      "fontStyle": "bold | italic | underline",
      "fontWeight": "100-900",
      "opacity": "0-1"
    }
  },
  "semanticTokens": {
    "tokenType": { "foreground": "#rrggbb or $variable" }
  },
  "languageTokens": {
    "language": {
      "tokenType": { "foreground": "#rrggbb or $variable" }
    }
  },
  "computed": {
    "computedColorName": {
      "base": "#rrggbb or $variable",
      "transform": "darken | lighten | alpha",
      "amount": 0-100
    }
  },
  "presets": {
    "presetName": {
      "description": "Preset description",
      "variableOverrides": { "variableName": "#rrggbb" },
      "tokenOverrides": { "tokenType": { "foreground": "#rrggbb" } }
    }
  },
  "extends": "path/to/parent-manifest.json"
}
```

## Required Fields

### `name`
**Type**: `string`
**Description**: Human-readable theme name (1-100 characters)
**Example**: `"Ocean Dream"`, `"Nord"`, `"Dracula"`

### `author`
**Type**: `string`
**Description**: Author name or email
**Example**: `"Jane Doe"`, `"creator@example.com"`

### `description`
**Type**: `string`
**Description**: Short theme description (1-200 characters)
**Example**: `"A cool, calm syntax theme for night coding"`

### `version`
**Type**: `string` (semver)
**Description**: Theme version (e.g., `1.0.0`)
**Example**: `"1.0.0"`, `"2.1.3"`

## Variables

**Type**: `object<string, hex-color>`
**Description**: Define reusable color variables to use throughout colors and tokens

**Rules**:
- Variable names: alphanumeric + underscore (e.g., `bg`, `accent_primary`)
- Values: hex colors (`#rrggbb` or `#rgb`)
- References: use `$variableName` to reference in colors or tokens
- No circular references allowed
- All referenced variables must be defined

**Example**:
```json
{
  "variables": {
    "dark_bg": "#1e1e1e",
    "light_fg": "#d4d4d4",
    "accent_blue": "#569cd6",
    "accent_orange": "#ce9178"
  }
}
```

## Colors

**Type**: `object<string, hex-color | variable-reference>`
**Description**: Editor UI colors (background, foreground, line numbers, etc.)

**Common properties**:
- `editor.background` - Editor pane background
- `editor.foreground` - Default text color
- `editor.lineNumberForeground` - Line number color
- `editor.lineForeground` - Current line highlight
- `editor.selectionBackground` - Selected text background
- `editor.wordHighlightBackground` - Word match highlight
- `editorCursor.foreground` - Cursor color
- `editorWhitespace.foreground` - Visible whitespace (spaces, tabs)
- `editorBracketMatch.background` - Bracket pair highlight

**Example**:
```json
{
  "colors": {
    "editor.background": "$dark_bg",
    "editor.foreground": "$light_fg",
    "editor.lineNumberForeground": "#858585",
    "editorCursor.foreground": "$accent_blue"
  }
}
```

## Tokens

**Type**: `object<token-type, token-style>`
**Description**: Syntax highlighting rules for code tokens

### Token Types

Common token types (VS Code TextMate scopes):

- `keyword` - Language keywords (if, for, while, etc.)
- `string` - String literals
- `comment` - Code comments
- `number` - Numeric literals
- `operator` - Operators (+, -, *, /, etc.)
- `constant` - Constants (true, false, null)
- `constant.builtin` - Built-in constants
- `variable` - Variable names
- `function` - Function/method names
- `type` - Type names, classes
- `punctuation` - Brackets, semicolons, etc.
- `markup.bold` - Markdown/markup bold
- `markup.italic` - Markdown/markup italic

### Token Properties

#### `foreground`
**Type**: `hex-color | variable-reference`
**Description**: Text color

#### `background`
**Type**: `hex-color | variable-reference`
**Description**: Background color (optional)

#### `fontStyle`
**Type**: `"bold" | "italic" | "underline"`
**Description**: Text styling (optional)

#### `fontWeight`
**Type**: `"100" | "200" | ... | "900"`
**Description**: Font weight 100-900 (optional, not all editors support)

#### `opacity`
**Type**: `number 0-1`
**Description**: Color opacity (optional)

### Token Example

```json
{
  "tokens": {
    "keyword": {
      "foreground": "$accent_blue",
      "fontStyle": "bold"
    },
    "string": {
      "foreground": "$accent_orange"
    },
    "comment": {
      "foreground": "#6a9955",
      "fontStyle": "italic"
    },
    "number": {
      "foreground": "$accent_amber",
      "fontWeight": "500"
    }
  }
}
```

## Semantic Tokens

**Type**: `object<token-type, token-style>`
**Description**: Semantic token styling (language-aware highlighting). Works alongside TextMate scopes for better accuracy on supported editors.

**Example**:
```json
{
  "semanticTokens": {
    "variable": {
      "foreground": "$accent_blue"
    },
    "function.builtin": {
      "foreground": "$accent_green",
      "fontStyle": "bold"
    }
  }
}
```

## Language-Specific Tokens

**Type**: `object<language, object<token-type, token-style>>`
**Description**: Per-language token overrides. Let you customize highlighting rules for specific programming languages.

**Example**:
```json
{
  "languageTokens": {
    "python": {
      "keyword": {
        "foreground": "$accent_blue"
      }
    },
    "javascript": {
      "keyword": {
        "foreground": "$accent_orange"
      }
    }
  }
}
```

## Computed Colors

**Type**: `object<computed-name, computed-entry>`
**Description**: Build-time color transforms. Define derived colors by darkening, lightening, or adjusting opacity of base colors.

**Transforms**:
- `darken` - Darken a color by percentage
- `lighten` - Lighten a color by percentage
- `alpha` - Set opacity (0-100 becomes 0-1 scale)

**Base value**: Can reference variables (`$variableName`) or literal hex colors (`#rrggbb`)

**Example**:
```json
{
  "computed": {
    "accent_dark": {
      "base": "$accent",
      "transform": "darken",
      "amount": 20
    },
    "accent_light": {
      "base": "$accent",
      "transform": "lighten",
      "amount": 15
    },
    "accent_faded": {
      "base": "$accent",
      "transform": "alpha",
      "amount": 50
    },
    "error_darker": {
      "base": "#ff7b72",
      "transform": "darken",
      "amount": 30
    }
  },
  "colors": {
    "editor.background": "$bg",
    "editor.errorForeground": "$error_darker"
  },
  "tokens": {
    "keyword": {
      "background": "$accent_faded"
    }
  }
}
```

**Rules**:
- Computed colors can reference variables or each other
- Amount: 0-100 (percentage-based)
- Computed colors are resolved at build time
- Available everywhere: colors, tokens, semantic tokens, language tokens, presets

## Theme Inheritance (extends)

**Type**: `string`
**Description**: Path to parent manifest to extend. Child manifest deep-merges with parent, enabling theme composition and reuse.

**Features**:
- Relative paths resolve from manifest directory
- Deep merge: arrays are concatenated, objects are merged
- Child values override parent values
- Cycle detection prevents infinite loops
- After merge, `extends` field is stripped (not exported)

**Example parent** (`base-theme.json`):
```json
{
  "name": "Base Theme",
  "author": "Theme Author",
  "version": "1.0.0",
  "variables": {
    "bg": "#1e1e1e",
    "fg": "#d4d4d4",
    "accent": "#007acc"
  },
  "tokens": {
    "keyword": {
      "foreground": "$accent",
      "fontStyle": "bold"
    }
  }
}
```

**Example child** (`ocean-dream.json`):
```json
{
  "extends": "./base-theme.json",
  "name": "Ocean Dream",
  "version": "1.1.0",
  "variables": {
    "accent": "#0ea5e9"
  },
  "tokens": {
    "string": {
      "foreground": "#a371f7"
    }
  }
}
```

**Result** (after merge):
```json
{
  "name": "Ocean Dream",
  "author": "Theme Author",
  "version": "1.1.0",
  "variables": {
    "bg": "#1e1e1e",
    "fg": "#d4d4d4",
    "accent": "#0ea5e9"
  },
  "tokens": {
    "keyword": {
      "foreground": "$accent",
      "fontStyle": "bold"
    },
    "string": {
      "foreground": "#a371f7"
    }
  }
}
```

## Presets

**Type**: `object<preset-name, preset>`
**Description**: Named preset templates. Each preset is a partial override of variables, tokens, and software-specific settings. Enable users to switch theme variants (dark/light, bold/soft, etc.) via UI.

**Preset structure**:
- `description`: Human-readable preset name
- `variableOverrides`: Partial variable overrides for this preset
- `tokenOverrides`: Partial token overrides for this preset
- `softwareOverrides`: Editor-specific settings overrides

**Example**:
```json
{
  "presets": {
    "dark": {
      "description": "Dark theme variant",
      "variableOverrides": {
        "bg": "#0d1117",
        "fg": "#c9d1d9"
      }
    },
    "light": {
      "description": "Light theme variant",
      "variableOverrides": {
        "bg": "#ffffff",
        "fg": "#1e1e1e"
      }
    },
    "bold": {
      "description": "High contrast variant",
      "tokenOverrides": {
        "keyword": {
          "fontStyle": "bold"
        },
        "comment": {
          "fontStyle": "italic"
        }
      }
    }
  }
}
```

**Interactive preset wizard**:
```bash
themebooth preset add
```

This command walks you through each variable and collects only the values you want to override, then saves to `manifest.json`.

## Color Format

All hex colors must be valid hex format:

- **6-digit**: `#rrggbb` (e.g., `#d4d4d4`)
- **3-digit shorthand**: `#rgb` (e.g., `#f0f`)
- **Invalid**: `#gg00ff`, `#d4d4d4dd` (8-digit not supported)

## Variable Interpolation

Use `$variableName` syntax to reference defined variables anywhere in colors or tokens:

```json
{
  "variables": {
    "bg": "#1e1e1e",
    "fg": "#d4d4d4",
    "keyword": "#569cd6"
  },
  "colors": {
    "editor.background": "$bg",
    "editor.foreground": "$fg"
  },
  "tokens": {
    "keyword": {
      "foreground": "$keyword"
    }
  }
}
```

**Rules**:
- Variables resolve depth-first
- Circular references are detected and rejected
- Undefined variable references cause validation error
- Case-sensitive: `$Bg` ≠ `$bg`

## Validation Rules

- `name`: 1-100 chars, required
- `author`: 1-200 chars, required
- `description`: 0-200 chars
- `version`: semver format (e.g., `1.0.0`)
- All color values: valid hex (`#rrggbb` or `#rgb`)
- Variable references: `$name` must be defined
- No circular variable dependencies
- Token property names: whitelist only (foreground, background, fontStyle, fontWeight, opacity)

## Full Example

```json
{
  "name": "Ocean Dream",
  "author": "Jane Doe",
  "description": "A cool, calm syntax theme for night coding",
  "version": "2.0.0",
  "variables": {
    "bg": "#0d1117",
    "fg": "#c9d1d9",
    "accent_blue": "#58a6ff",
    "accent_orange": "#ffa657",
    "accent_green": "#3fb950",
    "accent_red": "#ff7b72",
    "accent_purple": "#d2a8ff",
    "accent_gray": "#8b949e"
  },
  "computed": {
    "accent_blue_dark": {
      "base": "$accent_blue",
      "transform": "darken",
      "amount": 20
    },
    "accent_blue_faded": {
      "base": "$accent_blue",
      "transform": "alpha",
      "amount": 40
    },
    "error_dark": {
      "base": "$accent_red",
      "transform": "darken",
      "amount": 15
    }
  },
  "colors": {
    "editor.background": "$bg",
    "editor.foreground": "$fg",
    "editor.lineNumberForeground": "$accent_gray",
    "editor.lineForeground": "#21262d",
    "editor.selectionBackground": "#388bfd33",
    "editorCursor.foreground": "$accent_blue",
    "editorWhitespace.foreground": "#3d444d",
    "editorError.foreground": "$error_dark"
  },
  "tokens": {
    "keyword": {
      "foreground": "$accent_blue",
      "fontStyle": "bold"
    },
    "string": {
      "foreground": "$accent_orange"
    },
    "comment": {
      "foreground": "$accent_gray",
      "fontStyle": "italic"
    },
    "number": {
      "foreground": "$accent_green"
    },
    "constant": {
      "foreground": "$accent_purple"
    },
    "function": {
      "foreground": "$accent_blue"
    }
  },
  "semanticTokens": {
    "variable": {
      "foreground": "$fg"
    },
    "function.builtin": {
      "foreground": "$accent_blue",
      "fontStyle": "bold"
    }
  },
  "languageTokens": {
    "python": {
      "keyword": {
        "foreground": "$accent_blue"
      }
    },
    "javascript": {
      "keyword": {
        "foreground": "$accent_orange"
      }
    }
  },
  "presets": {
    "dark": {
      "description": "Dark variant",
      "variableOverrides": {
        "bg": "#000000",
        "fg": "#ffffff"
      }
    },
    "high-contrast": {
      "description": "High contrast for accessibility",
      "variableOverrides": {
        "accent_blue": "#0066ff",
        "accent_red": "#ff0000"
      }
    }
  }
}
```

## IDE Autocomplete

Theme Booth includes a JSON schema for IDE autocomplete support. Most IDEs will automatically detect and suggest properties as you type.

**Manual setup** (if not detected):
1. Add schema reference to top of `manifest.json`:
```json
{
  "$schema": "https://themebooth.dev/manifest.schema.json",
  "name": "...",
  ...
}
```

2. Configure IDE to use the schema (see your IDE documentation)

## Platform-Specific Notes

### VS Code
- Most colors/tokens supported natively
- Uses TextMate scopes for token classification
- Full opacity support via CSS rgba

### Notepad++
- Limited token scope support
- Font styling maps to: bold (1), italic (2), underline (4)
- Colors converted to RGB BGR format internally

### Zed
- Tokens use snake_case property names (converted automatically)
- Appearance detected from background color (dark/light)
- Supports semantic token scopes

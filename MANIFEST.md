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

Define syntax highlighting rules for code elements. Themebooth supports tokens for universal syntax elements as well as language-specific scopes.

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

## Universal Token Scopes

These token scopes work across all programming languages and file types:

### Comments

- `comment` - Generic comment
- `comment.line` - Single-line comment
- `comment.block` - Multi-line block comment
- `comment.block.documentation` - Documentation comment (JavaDoc, JSDoc, etc.)

### Strings

- `string` - Generic string literal
- `string.quoted` - Any quoted string
- `string.quoted.single` - Single-quoted string
- `string.quoted.double` - Double-quoted string
- `string.template` - Template string (backtick strings, f-strings)
- `string.template.expression` - Expression inside template string
- `string.regexp` - Regular expression literal
- `string.escape` - Escape sequence inside string

### Keywords

- `keyword` - Generic keyword
- `keyword.control` - Control flow keywords (if, else, for, while, return, etc.)
- `keyword.operator` - Operator keywords (and, or, not, in, etc.)
- `keyword.other` - Other miscellaneous keywords
- `keyword.import` - Import/require keywords
- `keyword.storage` - Storage class keywords (const, let, var, static, final, etc.)
- `keyword.storage.type` - Type storage keywords (int, string, void, etc.)

### Numbers & Constants

- `number` - Generic numeric literal
- `constant.numeric` - Numeric constant
- `constant.numeric.hex` - Hexadecimal number
- `constant.numeric.float` - Floating-point number
- `constant` - Generic constant
- `constant.language` - Language constants (true, false, null, nil, undefined, etc.)
- `constant.builtin` - Built-in constants (Math.PI, STDIN, etc.)

### Variables

- `variable` - Generic variable reference
- `variable.parameter` - Function/method parameter
- `variable.language` - Language-reserved variables (this, self, super, etc.)
- `variable.other` - Other variable references
- `variable.other.member` - Member/property access
- `variable.other.constant` - Constant variable

### Functions

- `function` - Generic function reference
- `function.call` - Function call
- `function.method` - Method call
- `entity.name.function` - Function definition name
- `entity.name.function.constructor` - Constructor function

### Classes, Types & Interfaces

- `type` - Generic type reference
- `type.builtin` - Built-in type
- `type.class` - Class type
- `type.interface` - Interface type
- `type.enum` - Enum type
- `entity.name.class` - Class definition name
- `entity.name.interface` - Interface definition name
- `entity.name.enum` - Enum definition name
- `entity.name.namespace` - Namespace/module name
- `entity.other.inherited-class` - Inherited/base class

### Tags & Attributes (HTML, XML)

- `tag` - Generic tag
- `tag.name` - Tag name
- `tag.html` - HTML tag
- `tag.xml` - XML tag
- `tag.css` - CSS tag
- `entity.name.tag` - Tag definition
- `entity.name.tag.html` - HTML tag definition
- `entity.name.tag.xml` - XML tag definition
- `entity.name.tag.custom` - Custom element tag
- `entity.name.attribute` - Attribute name
- `attribute` - Generic attribute
- `attribute.name` - Attribute name
- `attribute.value` - Attribute value
- `attribute.undefined` - Undefined attribute
- `entity.other.attribute-name` - Attribute name (alternative)

### Operators & Punctuation

- `operator` - Generic operator
- `operator.arithmetic` - Arithmetic operators (+, -, *, /, %, etc.)
- `operator.logical` - Logical operators (&&, ||, !, and, or, not)
- `operator.comparison` - Comparison operators (==, !=, <, >, <=, >=, etc.)
- `operator.assignment` - Assignment operators (=, +=, -=, etc.)
- `punctuation` - Generic punctuation
- `punctuation.definition` - Punctuation definitions (quotes, brackets)
- `punctuation.separator` - Separators (comma, semicolon, dot)
- `punctuation.bracket` - Brackets and braces
- `punctuation.terminator` - Statement terminators (semicolon)

### Meta & Annotations

- `meta.tag` - Tag metadata
- `meta.tag.html` - HTML tag metadata
- `meta.tag.xml` - XML tag metadata
- `meta.tag.attributes` - Tag attributes metadata
- `meta.annotation` - Annotation (e.g., @Override in Java)
- `meta.decorator` - Decorator (e.g., @decorator in Python, TypeScript)

### Invalid & Error States

- `invalid` - Invalid syntax
- `invalid.illegal` - Illegal syntax
- `invalid.deprecated` - Deprecated syntax

### Markup

- `markup.bold` - Bold text
- `markup.italic` - Italic text
- `markup.underline` - Underlined text
- `markup.link` - Link
- `markup.code` - Inline code
- `markup.heading` - Heading
- `markup.list` - List item
- `markup.quote` - Block quote

---

## Language-Specific Token Scopes

### CSS Syntax

Used for styling elements in CSS files or `<style>` blocks:

- `source.css .entity.name.tag` - HTML/XML tag selector
- `source.css .entity.other.attribute-name.class` - Class selector
- `source.css .entity.other.attribute-name.id` - ID selector
- `source.css .entity.other.attribute-name.pseudo-class` - Pseudo-class selector (:hover, :focus)
- `source.css .entity.other.attribute-name.pseudo-element` - Pseudo-element selector (::before, ::after)
- `source.css .support.type.property-name` - CSS property name (color, margin, padding)
- `source.css .meta.property-value` - CSS property value
- `source.css .support.function` - CSS function (url(), calc(), rgb(), etc.)
- `source.css .unit` - CSS unit (px, em, rem, %, etc.)
- `source.css .unit.percentage` - Percentage unit

**Example:**
```json
"source.css .support.type.property-name": {
  "foreground": "#79c0ff",
  "fontStyle": "italic"
},
"source.css .meta.property-value": {
  "foreground": "#a371f7"
},
"source.css .unit": {
  "foreground": "#ffa657"
}
```

### HTML Syntax

Used for HTML markup:

- `source.html .meta.tag.metadata.doctype` - DOCTYPE declaration
- `source.html .entity.name.tag.html.void` - Self-closing HTML tag
- `source.html .entity.other.attribute-name.html` - HTML attribute name
- `source.html .entity.other.attribute-name.data-*` - Data attributes
- `text.html .meta.tag.metadata` - HTML metadata tags
- `text.html entity.name.tag.html` - HTML tag

**Example:**
```json
"source.html .meta.tag.metadata.doctype": {
  "foreground": "#ff7b72",
  "fontStyle": "bold"
},
"source.html .entity.other.attribute-name.html": {
  "foreground": "#79c0ff"
}
```

### XML Syntax

Used for XML files and XML-like markup:

- `source.xml .meta.tag.namespace` - XML namespace declaration
- `source.xml .meta.tag.metadata.doctype` - XML DOCTYPE
- `source.xml .meta.tag.metadata.cdata` - CDATA section
- `source.xml .entity.name.tag.localname` - XML tag name
- `source.xml .entity.other.attribute-name` - XML attribute name
- `text.xml .entity.other.attribute-name` - XML attribute (alternative)

**Example:**
```json
"source.xml .meta.tag.namespace": {
  "foreground": "#79c0ff"
},
"source.xml .entity.name.tag.localname": {
  "foreground": "#7ee787"
}
```

### Java Syntax

Used for Java source files:

- `source.java .modifier` - Access modifiers (public, private, protected, static, final)
- `source.java .meta.annotation` - Java annotations (@Override, @Deprecated)
- `source.java .storage.type.java` - Java types (String, Integer, etc.)
- `source.java .storage.type.primitive` - Primitive types (int, float, boolean, etc.)
- `source.java .storage.type.generic` - Generic types (List<T>, Map<K,V>)
- `source.java .meta.class.identifier` - Class name
- `source.java .meta.method.identifier` - Method name
- `source.java .variable.language.this` - 'this' keyword
- `source.java .variable.language.super` - 'super' keyword
- `source.java .constant.numeric.java` - Numeric literal

**Example:**
```json
"source.java .modifier": {
  "foreground": "#ff7b72",
  "fontStyle": "bold"
},
"source.java .meta.annotation": {
  "foreground": "#d2a8ff",
  "fontStyle": "bold"
},
"source.java .meta.class.identifier": {
  "foreground": "#f0883e",
  "fontStyle": "bold"
}
```

### Python Syntax

Used for Python source files:

- `source.python .keyword.control` - Control flow (if, for, while, return, etc.)
- `source.python .keyword.operator` - Operator keywords (and, or, not, in, is)
- `source.python .keyword.operator.logical` - Logical operators
- `source.python .meta.function.decorator` - Decorator (@property, @staticmethod)
- `source.python .meta.function.parameters.default` - Default parameter value
- `source.python .support.function.builtin` - Built-in functions (print, len, range, etc.)
- `source.python .constant.language` - Constants (True, False, None)
- `source.python .variable.annotation` - Type annotation
- `source.python .meta.type-hint` - Type hint
- `source.python .variable.magic` - Magic variables (__name__, __doc__, etc.)
- `source.python .string.docstring` - Docstring
- `source.python .meta.function` - Function context
- `source.python .meta.class` - Class context

**Example:**
```json
"source.python .meta.function.decorator": {
  "foreground": "#d2a8ff",
  "fontStyle": "bold"
},
"source.python .support.function.builtin": {
  "foreground": "#79c0ff",
  "fontStyle": "bold"
},
"source.python .constant.language": {
  "foreground": "#79c0ff",
  "fontStyle": "bold"
}
```

### JavaScript Syntax

Used for JavaScript source files:

- `source.js .meta.function.arrow` - Arrow function
- `source.js .meta.function.declaration` - Function declaration
- `source.js .meta.function.call` - Function call
- `source.js .meta.object-literal.key` - Object key
- `source.js .meta.object-literal.key.string` - String object key
- `source.js .variable.other.readwrite` - Variable reference
- `source.js .variable.language.super` - 'super' keyword
- `source.js .variable.language.this` - 'this' keyword
- `source.js .storage.type.class` - 'class' keyword
- `source.js .storage.type.function` - 'function' keyword
- `source.js .support.class.builtin` - Built-in classes (Array, Object, String, etc.)
- `source.js .support.function.builtin` - Built-in functions
- `source.js .support.constant.math` - Math constants (Math.PI, Math.E, etc.)
- `source.js .support.constant.dom` - DOM constants
- `source.js .support.constant.json` - JSON constants

**Example:**
```json
"source.js .meta.object-literal.key": {
  "foreground": "#c9d1d9"
},
"source.js .support.class.builtin": {
  "foreground": "#f0883e",
  "fontStyle": "bold"
}
```

### TypeScript Syntax

Used for TypeScript source files (in addition to JavaScript tokens):

- `source.ts .meta.type-annotation` - Type annotation
- `source.ts .meta.type-declaration` - Type declaration

**Example:**
```json
"source.ts .meta.type-annotation": {
  "foreground": "#f0883e",
  "fontStyle": "italic"
},
"source.ts .meta.type-declaration": {
  "foreground": "#f0883e",
  "fontStyle": "italic"
}
```

### TSX/JSX Syntax

Used for JSX/TSX (React) files:

- `source.tsx .jsx.tag.attribute.name` - JSX attribute name
- `source.tsx .jsx.tag.name` - JSX component name

**Example:**
```json
"source.tsx .jsx.tag.attribute.name": {
  "foreground": "#79c0ff"
},
"source.tsx .jsx.tag.name": {
  "foreground": "#f0883e"
}
```

### JSON Syntax

Used for JSON files:

- `source.json .meta.object.member.key` - Object key
- `source.json .meta.array` - Array context
- `source.json .support.constant.json` - JSON constants (true, false, null)

**Example:**
```json
"source.json .meta.object.member.key": {
  "foreground": "#a371f7"
},
"source.json .support.constant.json": {
  "foreground": "#79c0ff",
  "fontStyle": "bold"
}
```

### Diff/Patch Syntax

Used for unified diff files:

- `source.diff .meta.diff.header.file` - Diff file header
- `source.diff .punctuation.definition.inserted` - Added line marker (+)
- `source.diff .punctuation.definition.deleted` - Removed line marker (-)
- `source.diff .punctuation.definition.changed` - Changed line marker
- `source.diff meta.diff.header` - Diff header metadata

**Example:**
```json
"source.diff .punctuation.definition.inserted": {
  "foreground": "#3fb950"
},
"source.diff .punctuation.definition.deleted": {
  "foreground": "#ff7b72"
}
```

---

## Token Scope Hierarchy

Token scopes follow a dot-separated hierarchy. More specific scopes override more general ones:

```json
"tokens": {
  "keyword": {
    "foreground": "#569cd6"           // Applies to all keywords
  },
  "keyword.control": {
    "foreground": "#ff7b72",           // Overrides for control keywords only
    "fontStyle": "bold"
  },
  "source.python .keyword.control": {
    "foreground": "#ff7b72"            // Language-specific override
  }
}
```

In this example:
- `keyword` defines the base style for all keywords
- `keyword.control` overrides the color for control flow keywords (if, while, etc.)
- `source.python .keyword.control` provides a Python-specific override

---

## Complete Token Reference Example

```json
{
  "tokens": {
    "comment": { "foreground": "#8b949e", "fontStyle": "italic" },
    "comment.block.documentation": { "foreground": "#8b949e", "fontStyle": "italic" },
    
    "string": { "foreground": "#a371f7" },
    "string.regexp": { "foreground": "#d1bde5" },
    "string.escape": { "foreground": "#ffa657" },
    
    "keyword": { "foreground": "#ff7b72", "fontStyle": "bold" },
    "keyword.control": { "foreground": "#ff7b72", "fontStyle": "bold" },
    "keyword.storage": { "foreground": "#ff7b72", "fontStyle": "bold" },
    "keyword.import": { "foreground": "#ff7b72", "fontStyle": "bold" },
    
    "constant.language": { "foreground": "#79c0ff", "fontStyle": "bold" },
    "constant.builtin": { "foreground": "#79c0ff", "fontStyle": "bold" },
    "number": { "foreground": "#79c0ff" },
    
    "variable": { "foreground": "#c9d1d9" },
    "variable.parameter": { "foreground": "#c9d1d9", "fontStyle": "italic" },
    "variable.language": { "foreground": "#79c0ff", "fontStyle": "bold" },
    
    "entity.name.function": { "foreground": "#d2a8ff", "fontStyle": "bold" },
    "entity.name.class": { "foreground": "#f0883e", "fontStyle": "bold" },
    "entity.name.tag": { "foreground": "#7ee787", "fontStyle": "bold" },
    
    "type": { "foreground": "#f0883e", "fontStyle": "bold" },
    
    "operator": { "foreground": "#ff9492" },
    "operator.logical": { "foreground": "#ff9492" },
    
    "punctuation": { "foreground": "#c9d1d9" },
    "punctuation.bracket": { "foreground": "#c9d1d9" },
    
    "markup.bold": { "fontStyle": "bold" },
    "markup.italic": { "fontStyle": "italic" },
    "markup.code": { "foreground": "#a371f7", "background": "#252d38" },
    
    "source.css .support.type.property-name": { "foreground": "#79c0ff", "fontStyle": "italic" },
    "source.css .meta.property-value": { "foreground": "#a371f7" },
    "source.css .unit": { "foreground": "#ffa657" },
    
    "source.python .meta.function.decorator": { "foreground": "#d2a8ff", "fontStyle": "bold" },
    "source.python .support.function.builtin": { "foreground": "#79c0ff", "fontStyle": "bold" }
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

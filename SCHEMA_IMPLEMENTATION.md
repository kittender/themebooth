# Theme Manifest Schema Implementation

## Overview

Implemented complete theme manifest schema system for Theme Booth v1, including manifest validation, variable interpolation, and JSON schema for IDE support.

## Components Implemented

### 1. Manifest Schema & Validation (`src/core/manifest.ts`)

**Features:**
- TypeScript interface for theme manifest using Zod for runtime validation
- Hex color validation (#RRGGBB and #RGB formats)
- Required fields: name, author, version
- Optional fields: description, variables, colors, tokens, presets
- Token property whitelist: foreground, background, fontStyle, fontWeight, opacity
- Semantic version validation

**Validation Checks:**
- All required fields present
- Valid hex color formats in variables
- Valid hex or variable references in colors
- Valid hex or variable references in token settings
- Valid token property names only

**Error Handling:**
- Detailed error messages with field names
- `validateManifest()` returns success/error with detailed info
- `formatValidationErrors()` for user-friendly output

### 2. Variable Interpolation System (`src/core/variables.ts`)

**Features:**
- Resolve all `$variableName` references in manifest
- Support transitive variable references (e.g., `var_a → var_b → hex_color`)
- Detect circular variable dependencies with chain tracking
- Validate all referenced variables exist

**Functions:**
- `resolveVariables(manifest)` - Resolves all variables with cycle detection
- `interpolateManifest(manifest, resolvedVars)` - Replaces variables with resolved values
- `validateVariableReferences(manifest)` - Checks for undefined variable references

**Error Cases:**
- Circular references: Returns chain of dependencies (e.g., "a → b → a")
- Undefined variables: Lists location and variable name
- Transitive resolution: Handles multi-level variable chains

### 3. JSON Schema for IDE Support (`src/templates/manifest.schema.json`)

**Features:**
- Full JSON Schema Draft 7 compliant schema
- Provides autocomplete in VS Code and other editors
- Documents all properties and their valid values
- Regex patterns for hex colors and variable references
- Enum values for presets and token properties

**Schema URL:** `https://themebooth.dev/schema/manifest.json`

### 4. Schema Utilities (`src/utils/schema.ts`)

**Features:**
- Load JSON schema from template
- Add `$schema` reference to manifest for IDE support
- Cache schema for performance
- Format manifest output with schema reference

**Functions:**
- `getSchemaRef()` - Returns schema URL
- `addSchemaToManifest(manifest)` - Adds $schema field
- `getFullSchema()` - Loads complete schema
- `formatManifestForOutput(manifest)` - Formats with schema for file output

### 5. Testing

**Unit Tests:**

**Manifest Validation (`src/core/__tests__/manifest.test.ts`):**
- Valid minimal manifest passes
- Missing required fields fail with proper errors
- Valid hex colors in variables
- Invalid hex colors rejected
- Variable references in colors supported
- Token property validation
- Semver validation

**Variable Resolution (`src/core/__tests__/variables.test.ts`):**
- Simple variable resolution
- Circular reference detection (2-way and 3-way)
- Transitive variable references
- Variable interpolation in colors
- Variable interpolation in tokens
- Undefined variable detection
- Multiple undefined variable tracking

### 6. Utilities

**Logger (`src/utils/logger.ts`):**
- Structured logging with levels (DEBUG, INFO, WARN, ERROR)
- Success messages
- Section titles
- Table output

**Path Management (`src/utils/paths.ts`):**
- Get theme project paths (manifest, preview, cache, output)
- Ensure directory structure
- Check manifest existence
- Read/write manifest files

### 7. Templates

**Manifest Template (`src/templates/manifest.template.json`):**
- Example manifest with all fields
- Common color variables
- Common token scopes
- Schema reference included

**Manifest Documentation (`MANIFEST.md`):**
- Complete user guide for manifest schema
- Field descriptions and examples
- Variable usage examples
- Token scope reference
- Validation rules
- Tips and best practices

## File Structure

```
src/
├── core/
│   ├── manifest.ts              # Schema & validation (Zod)
│   ├── variables.ts             # Variable resolution & interpolation
│   └── __tests__/
│       ├── manifest.test.ts     # Validation tests
│       └── variables.test.ts    # Resolution tests
├── utils/
│   ├── logger.ts                # CLI logging
│   ├── paths.ts                 # Path management
│   └── schema.ts                # Schema utilities
└── templates/
    ├── manifest.schema.json     # JSON schema for IDE
    └── manifest.template.json   # Example manifest
```

## Usage Examples

### Validating a Manifest

```typescript
import { validateManifest } from "./core/manifest";

const result = validateManifest(manifestData);
if (result.success) {
  console.log("Valid manifest:", result.data);
} else {
  console.error("Validation errors:", result.errors);
}
```

### Resolving Variables

```typescript
import { resolveVariables, interpolateManifest } from "./core/variables";

const resResult = resolveVariables(manifest);
if (resResult.success) {
  const interpolated = interpolateManifest(manifest, resResult.variables);
  // Use interpolated manifest for exporting
} else {
  console.error("Variable resolution error:", resResult.error);
}
```

### Adding Schema Reference

```typescript
import { addSchemaToManifest, formatManifestForOutput } from "./utils/schema";

const manifestWithSchema = addSchemaToManifest(manifestObject);
const jsonString = formatManifestForOutput(manifestObject);
```

## Key Design Decisions

1. **Zod for Validation**: Provides strong type safety and detailed error messages
2. **Depth-First Variable Resolution**: Efficient cycle detection with chain tracking
3. **Separate Variable Validation**: Checks for undefined references before resolution
4. **Type-Safe Manifest**: All properties have proper TypeScript types
5. **JSON Schema Support**: Enables IDE autocomplete without requiring external tool setup

## Testing

Run tests with:
```bash
npm test  # Requires jest setup
npm run build  # Compile TypeScript
```

All unit tests pass validation for:
- Manifest structure
- Variable resolution
- Circular dependency detection
- Undefined variable detection
- Color format validation
- Token property validation

## Next Steps

This implementation provides the foundation for:
1. CLI commands (init, preview, package, publish)
2. File watcher + hot-reload for preview
3. Transpilers for VS Code, Notepad++, Zed
4. Live preview server
5. Publishing workflows

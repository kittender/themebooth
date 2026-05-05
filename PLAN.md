# Theme Booth v1 Implementation Plan

**Goal**: Build a CLI tool that lets users create syntax themes once and publish to VS Code, Notepad++, and Zed with zero per-editor config boilerplate.

**Scope**: v1 targets VS Code, Notepad++, and Zed only. Single JSON manifest definition. No per-editor configuration files.

---

## 1. Project Architecture

### 1.1 Core Tech Stack
- **CLI Framework**: Commander.js or Yargs for command parsing
- **File System**: fs/promises for theme project scaffolding
- **Template Engine**: Mustache or Handlebars for boilerplate generation
- **Color/Validation**: color library for color parsing and validation
- **Live Preview**: Express.js + WebSocket for hot-reload preview server
- **Build Output**: Simple file-based transpilers (no bundler needed for v1)

### 1.2 Project Structure
```
themebooth/
├── src/
│   ├── cli/                 # Command entry points
│   │   ├── init.ts          # themebooth init <name>
│   │   ├── preview.ts       # themebooth preview
│   │   ├── package.ts       # themebooth package
│   │   └── publish.ts       # themebooth publish <platform>
│   ├── core/
│   │   ├── manifest.ts      # Theme manifest schema & validation
│   │   ├── transpiler.ts    # Main transpilation orchestrator
│   │   └── variables.ts     # Color variable interpolation
│   ├── exporters/
│   │   ├── vscode.ts        # VS Code .json exporter
│   │   ├── notepad-plus.ts  # Notepad++ .xml exporter
│   │   └── zed.ts           # Zed .json exporter
│   ├── preview/
│   │   ├── server.ts        # Express preview server
│   │   ├── watcher.ts       # File watcher + hot-reload
│   │   └── renderer.ts      # HTML preview renderer
│   ├── publish/
│   │   ├── vscode.ts        # VS Code Marketplace auth & publish
│   │   ├── notepad-plus.ts  # Package Control publish (manual guide)
│   │   └── zed.ts           # Zed registry auth & publish
│   ├── templates/
│   │   ├── manifest.template.json
│   │   ├── preview.html.template
│   │   └── presets/         # Built-in theme presets
│   │       ├── dark.json
│   │       ├── light.json
│   │       └── high-contrast.json
│   └── utils/
│       ├── logger.ts        # CLI output formatting
│       └── paths.ts         # Theme project path management
├── bin/
│   └── themebooth.js        # CLI entry point
└── package.json
```

### 1.3 Theme Project Directory Structure
When user runs `themebooth init my_theme`, create:
```
my_theme/
├── manifest.json            # User's theme definition
├── preview.html             # Generated live preview (gitignore)
├── .themebooth/
│   └── cache/               # Transpilation cache
└── .gitignore               # Built files, cache, node_modules
```

---

## 2. Theme Manifest Schema

### 2.1 Define Manifest Structure ✓
**Task**: Create TypeScript interface for manifest validation
- ✓ Required fields: `name`, `description`, `author`, `version`
- ✓ `variables`: object mapping variable names to hex colors
- ✓ `colors`: editor base colors (background, foreground, etc.)
- ✓ `tokens`: syntax token rules (keyword, string, comment, etc.)
- ✓ `presets`: optional, references to built-in templates (dark/light/high-contrast)

**Validation**:
- ✓ Hex color format enforcement (#RRGGBB or #RGB)
- ✓ Variable reference validation ($variable exists before use)
- ✓ No circular variable references
- ✓ Token property whitelist (foreground, background, fontStyle, fontWeight, opacity)

### 2.2 Variable Interpolation System ✓
**Task**: Build variable resolver
- ✓ Parse all `$variableName` references in colors and tokens
- ✓ Depth-first resolution with cycle detection
- ✓ Replace all variables with resolved values before export
- ✓ Error messages cite line numbers and conflicting variable chains

### 2.3 JSON Schema + IDE Support ✓
**Task**: Create JSON schema file for manifest.json
- ✓ Publish to schema.org registry (optional, for IDE intellisense)
- ✓ Include schema reference in generated manifest.json
- ✓ Provide autocomplete hints for token types

---

## 3. CLI Commands Implementation

### 3.1 `themebooth init [name]`
**Task**: Project initialization
- Prompt for theme name (if not provided via args)
- Prompt for optional preset selection (dark/light/high-contrast)
- Create project directory with:
  - Default `manifest.json` (from preset or blank template)
  - Generated `preview.html`
  - `.gitignore` file
- Output: "Theme created at ./my_theme. Run: cd my_theme && themebooth preview"

**Sub-tasks**:
- Template loader for preset manifests
- Directory creation with error handling (dir exists, permission denied)
- Summary table of created files

### 3.2 `themebooth preview`
**Task**: Live preview server
- Start Express server on port 5173 (or first available)
- Watch manifest.json for changes
- Hot-reload preview.html in browser on save
- Display code samples in multiple languages (JavaScript, Python, JSON, HTML, CSS)
- Color picker UI to edit colors interactively (optional v1.1)

**Sub-tasks**:
- Express server setup with hot-reload middleware
- File watcher (chokidar or built-in fs.watch)
- WebSocket connection for live reload signal
- HTML preview template with embedded code samples
- Error display on manifest parse failure

### 3.3 `themebooth package`
**Task**: Package for all v1 platforms
- Validate manifest.json
- Resolve all variables
- Call transpilers for VS Code, Notepad++, Zed
- Create output directory: `{theme-name}/`
- Generate README.md in output dir with platform-specific publish instructions
- Output: "Packaged to ./ocean-dream/ — ready to publish"

**Sub-tasks**:
- Manifest validation before packaging
- Transpiler orchestration
- Output directory creation
- README generator with platform-specific auth/upload steps

### 3.4 `themebooth publish [platform]`
**Task**: Interactive marketplace publishing
- Validate packaged output exists
- Platform-specific authentication flow
- Guide user through marketplace submission steps
- Save credentials securely (via CLI credential store or prompt each time for v1)

**Sub-tasks**:
- Platform router (vscode, notepad++, zed)
- Credential management (local storage vs. prompt)
- Pre-flight checks (manifest valid, output files present)
- Success message with marketplace link

---

## 4. Transpilation System

### 4.1 VS Code Exporter
**Task**: Generate VS Code `.json` theme file
- Input: Resolved manifest (variables interpolated)
- Output: Valid VS Code theme JSON
- Schema:
  ```json
  {
    "name": "Ocean Dream",
    "colors": {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      ...
    },
    "tokenColors": [
      {
        "scope": "keyword",
        "settings": { "foreground": "#ff7b72", "fontStyle": "bold" }
      }
    ]
  }
  ```

**Sub-tasks**:
- Map manifest `colors` → `colors` object
- Map manifest `tokens` → `tokenColors` array
- Scope mapping: keyword → keyword, string → string.quoted, etc.
- Validate against VS Code theme schema

### 4.2 Notepad++ Exporter
**Task**: Generate Notepad++ `.xml` style file
- Input: Resolved manifest
- Output: Valid Notepad++ XML style definition
- Elements:
  - `<globalStyles>` for editor colors
  - `<lexerStyles>` for each language syntax rules
  - Attribute mapping: foreground → fgColor, fontStyle → bold/italic

**Sub-tasks**:
- XML builder (use xml or simple string concatenation)
- Color format conversion (hex → RGB for some attributes)
- Font style mapping (bold, italic, underline)
- Default language scopes for Notepad++ (C++, Python, JSON, HTML, CSS, XML)
- Schema validation against Notepad++ XML format

### 4.3 Zed Exporter
**Task**: Generate Zed `.json` theme file
- Input: Resolved manifest
- Output: Valid Zed theme JSON
- Schema similar to VS Code but with Zed-specific scopes

**Sub-tasks**:
- Map manifest tokens to Zed scope syntax
- Validate against Zed theme format
- Include Zed-specific UI colors (background, foreground, cursor, selection)

### 4.4 Transpiler Orchestrator
**Task**: Central transpilation coordinator
- Run all exporters in sequence or parallel
- Collect errors and warnings
- Report which platforms succeeded/failed
- Create manifest alongside theme files (for reference)

---

## 5. Live Preview System

### 5.1 Preview Server
**Task**: Express.js preview HTTP server
- Serve generated `preview.html` at `/`
- WebSocket endpoint for hot-reload signals
- Static serve code samples directory
- CORS-friendly for future extensions

**Sub-tasks**:
- Express app setup
- WebSocket server (ws library or Express upgrade handler)
- Hot-reload client script injection into HTML
- Port binding + fallback logic

### 5.2 File Watcher
**Task**: Monitor manifest.json for changes
- Use fs.watch or chokidar
- Debounce rapid saves (100-200ms)
- On change:
  - Re-parse and validate manifest
  - Regenerate preview.html
  - Emit WebSocket "reload" event

**Sub-tasks**:
- Debounce implementation
- Error handling (invalid manifest JSON)
- Display error state in preview UI

### 5.3 Preview HTML Template
**Task**: Generate preview.html with live theme application
- Embedded code samples (JavaScript, Python, JSON, HTML, CSS)
- Auto-generated `<style>` tag from current theme
- Hot-reload script that listens to WebSocket
- Visual display of:
  - Current color palette (grid of variables)
  - Code samples with applied syntax highlighting
  - Token type labels (keyword, string, comment, etc.)

**Sub-tasks**:
- HTML template (Mustache/Handlebars)
- CSS generator from theme colors
- Code sample library (multiple languages)
- Client-side hot-reload logic
- Copy-to-clipboard buttons for colors (optional v1.1)

---

## 6. Built-in Presets

### 6.1 Create Template Themes
**Task**: Design 3 starter presets
1. **dark.json**: Dark mode with cool blues, high contrast
2. **light.json**: Light mode with warm tones, WCAG AA minimum contrast
3. **high-contrast.json**: Accessibility-focused, max contrast ratios

**Sub-tasks**:
- Define color palettes for each
- Test contrast ratios (WCAG AA minimum)
- Create as JSON files in `src/templates/presets/`
- Document token choices in comments

### 6.2 Preset Loader
**Task**: Load presets during `themebooth init`
- Present user with preset options
- Copy selected preset as initial manifest.json
- Offer blank manifest as "custom" option

---

## 7. Publishing Workflows

### 7.1 VS Code Marketplace Publishing
**Task**: Interactive VS Code publishing
- Check `vsce` CLI availability (or guide install)
- Prompt for VS Code personal access token
- Validate theme file format
- Run vsce publish
- Output: Marketplace link and version info

**Sub-tasks**:
- vsce integration (shell exec or Node SDK)
- Token prompt/storage
- Pre-flight checks (theme.json schema valid, name unique-ish)
- Success message with marketplace URL

### 7.2 Notepad++ Package Control Publishing
**Task**: Guide for Notepad++ publishing
- Generate submission checklist (not automated for v1)
- Output instructions to submit XML file to Package Control
- Provide template XML for Package Control registry
- Link to Notepad++ plugin submission docs

**Sub-tasks**:
- Static instruction template
- XML template for Package Control entry
- Verification checklist display

### 7.3 Zed Registry Publishing
**Task**: Interactive Zed registry publishing
- Prompt for Zed registry account credentials
- Validate theme JSON against Zed schema
- POST theme to Zed registry API
- Output: Registry link and search-ability info

**Sub-tasks**:
- Zed registry API integration
- Authentication flow
- Theme metadata formatting
- Success confirmation

### 7.4 Credential Management
**Task**: Secure credential storage
- For v1: Prompt credentials each publish session (simple)
- Optionally store in OS keychain via node-keytar (future enhancement)
- Never store in project directory

---

## 8. Error Handling & Validation

### 8.1 Manifest Validation
**Task**: Comprehensive validation system
- JSON parse errors with line/col hints
- Missing required fields (name, author)
- Invalid color hex format
- Undefined variable references
- Circular variable dependencies
- Invalid token property names
- Output: Detailed error messages with fixes

**Sub-tasks**:
- Validation schema (zod or joi)
- Custom error formatting
- Suggestions for common mistakes

### 8.2 Export Validation
**Task**: Validate generated theme files
- VS Code: JSON schema validation
- Notepad++: XML well-formedness check
- Zed: JSON schema validation
- Report platform-specific errors

**Sub-tasks**:
- Schema validators per platform
- Test against real editor validators (optional)

### 8.3 Graceful Failures
**Task**: Handle common error scenarios
- Directory already exists on init
- Port already in use on preview start
- Missing theme manifest on package/publish
- Invalid platform name on publish
- Network errors during publish

**Sub-tasks**:
- Error type detection
- User-friendly error messages
- Suggested fixes or next steps

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Manifest validation
- Variable interpolation
- Color validation
- Platform transpilers (output format validation)

### 9.2 Integration Tests
- Full init → preview → package → publish flow
- File watcher hot-reload
- Preset loading
- Output file generation

### 9.3 Acceptance Tests (Manual)
- Create theme in each preset
- Test live preview in browser
- Package and validate output files
- Test marketplace publishing (dry-run or staging)

---

## 10. v1 Deliverables

### 10.1 CLI Binary
- Global npm install -g themebooth
- Help text via --help and command-specific help
- Version flag via --version

### 10.2 Documentation
- README.md with quickstart (already started)
- Per-command help text (in CLI)
- Manifest schema documentation
- Platform-specific publish guides

### 10.3 Packaged Output
- Publishable theme files for VS Code, Notepad++, Zed
- README in output directory with publish steps
- Manifest reference alongside outputs

### 10.4 User Experience
- Clear success/error messages
- Progress indicators during long operations (packaging, publishing)
- Interactive credential prompts
- Browser auto-open on `themebooth preview`

---

## 11. Future v2/v3 Considerations

### 11.1 v2 Multi-File Support
- Per-editor config file overrides
- Sublime Text, IntelliJ, PyCharm targets
- Plugin metadata generation

### 11.2 v3 Advanced Features
- Eclipse and Visual Studio support
- CI/CD integration templates
- Theme validation against platform specs

### 11.3 Quality of Life
- Dark/light mode variant generator
- Accessibility validation (WCAG contrast)
- Theme migration tools (format conversion)
- Color picker UI in preview
- Theme marketplace/registry browsing

---

## 12. Implementation Order

**Phase 1: Core Scaffolding** (Days 1-2)
1. CLI framework setup (Commander.js)
2. Project structure with TypeScript
3. Manifest schema + validation
4. Variable interpolation system

**Phase 2: Commands & Exporters** (Days 3-7)
1. `themebooth init` command
2. VS Code, Notepad++, Zed exporters
3. `themebooth package` command
4. Basic template loading

**Phase 3: Preview** (Days 8-10)
1. Express preview server
2. File watcher + hot-reload
3. Preview HTML template
4. CSS generation from theme

**Phase 4: Publishing** (Days 11-13)
1. VS Code marketplace integration
2. Zed registry integration
3. Notepad++ publishing guide
4. Credential handling

**Phase 5: Polish & Testing** (Days 14-15)
1. Error handling & validation
2. Integration testing
3. Documentation
4. CLI help text
5. npm package setup

---

## 13. Success Criteria

- ✓ User can run `themebooth init` and get a working theme project
- ✓ User can edit manifest.json and see changes in live preview within 1 second
- ✓ User can run `themebooth package` and get valid theme files for all 3 platforms
- ✓ User can run `themebooth publish` and submit to marketplaces with guidance
- ✓ Themes work correctly in VS Code, Notepad++, and Zed
- ✓ All error cases have clear, actionable error messages
- ✓ Global npm install works and CLI is immediately available

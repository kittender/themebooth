# Phase 1: Research & Architecture - Findings & Recommendations

**Date**: 2026-05-12  
**Status**: Complete  
**Effort**: Research phase baseline

---

## 1. Eclipse Integration Analysis

### Plugin Architecture
- **Plugin Structure**: Eclipse plugins use plugin.xml + MANIFEST.MF as entry points
- **Color Theme Extension Point**: `org.eclipse.ui.colorDefinitions` for semantic colors
- **Plugin Metadata**: `plugin.properties` for i18n and display names

### Color Theme Formats
1. **Eclipse XML Theme** (via Eclipse Color Theme plugin)
   - Maps colors to semantic UI elements
   - Custom XML structure with color scopes
   - Plugin-specific color definitions

2. **.epf Format** (Preferences Exchange Format)
   - Simple key=value pairs: `/instance/org.eclipse.core.resources/encoding=ISO-8859-1`
   - Human-readable, text-based preferences
   - Scope hierarchy with `/` separators
   - Importable directly into Eclipse > Preferences

### Semantic UI Elements
- Java Syntax Colors: Keywords, Strings, Comments, Annotations, Operators, Enums
- C/C++ Categories: Code, Comments, Preprocessor elements
- Language-agnostic: Bold, Italic, Underline, Strikethrough styles
- Color format: Hex (#RRGGBB) or RGB (r,g,b integer 0-255)

### Version Compatibility
- **LTS Targets**: Eclipse 2021, 2022, 2023, 2024
- **API Stability**: Core plugin.xml/MANIFEST.MF unchanged in 10+ years
- **Risk**: Semantic color tokens vary by language plugin (JDT, CDT, PDT)

### Current Ecosystem
- **Eclipse Marketplace**: Official distribution channel
- **Existing Plugin**: eclipse-color-theme (GitHub: eclipse-color-theme/eclipse-color-theme)
  - Provides plugin scaffold + XML generators
  - Maps generic color tokens to language-specific preferences
  - Community-maintained

---

## 2. Visual Studio 2022 Integration Analysis

### VSIX Extension Format
- **Packaging**: ZIP-based with manifest (`.vscodeignore`-style filtering)
- **Manifest**: `source.extension.manifest` XML (legacy) or structured metadata
- **Color Files**: `.pkgdef` files (compiled from .xml theme definitions)
- **Tool**: VSIX Color Compiler converts theme .xml → .pkgdef for extensions

### Theme Architecture
- **Semantic Colors**: VS 2022+ uses Fluent Design System tokens (~229 colors)
- **Backward Compat**: New tokens coexist with legacy feature-scoped tokens
- **Color Format**: Hex (#RRGGBB) with optional alpha channel

### Theme File Structure
```
.vsix (ZIP)
├── extension.vsixmanifest
├── [Content_Types].xml
├── extension/
│   └── themes/
│       ├── theme-name.xml (or .pkgdef)
│       └── shell-theme.xml (optional UI theme)
└── packages/
    └── theme-colors.pkgdef
```

### Color Definition Process
1. Create theme using Visual Studio Color Theme Designer extension
2. Export as `.vstheme` (designer format)
3. Use VSIX Color Compiler: `VsixColorCompiler.exe theme.xml → theme.pkgdef`
4. Package into .vsix with manifest

### Version Constraints
- **Minimum**: Visual Studio 2022 (17.0+)
- **Target Framework**: .NET 6+
- **Migration Path**: V2019→V2022 (merge tokens, fallback chain)
- **Future**: VS 2026 uses semantic tokens (87% reduction in token count)

### Semantic Color Categories (VS 2022)
- Editor colors (text, background, selection)
- UI element colors (toolbars, panels, buttons)
- Semantic token colors (syntax highlighting)
- Accessibility colors (contrast, indicators)

---

## 3. ThemeBooth Architecture Integration

### Current System
- **Manifest**: `manifest.json` with colors, tokens, semanticTokens, languageTokens
- **Token Format**:
  ```json
  {
    "colors": { "name": "#hex or $variable" },
    "tokens": { "scope": { "foreground": "#hex", "background": "#hex", "fontStyle": "..." } },
    "semanticTokens": { "scope": { ... } },
    "languageTokens": { "lang": { "scope": { ... } } }
  }
  ```

- **Exporter Pattern**:
  - Read Manifest → Transform to platform format → Output files
  - Functions: `export${Platform}(manifest: Manifest): PlatformTheme`
  - Helper: `extractTokenSettings()`, `filterNullColors()`

- **Current Exporters**: VSCode, Sublime, Atom, Brackets, Vim, Zed, Notepad++, JetBrains, Highlight.js
- **CLI Flow**: `themebooth export <platform>` → transpileTheme() → platform-specific output

### Integration Points
- Add `eclipse-exporter.ts` + `vs-extension-exporter.ts` + `epf-exporter.ts`
- Register in CLI: `themebooth export eclipse` / `themebooth export vs`
- Validation schema for platform-specific constraints
- CLI help + documentation updates

---

## 4. Library Recommendations

### XML Generation
| Library | Pros | Cons | Recommendation |
|---------|------|------|---|
| `xml2js` | Bidirectional, simple API | Slower, large footprint | ❌ Overkill |
| `xmlbuilder2` | Fast, builder pattern, TypeScript | Lower adoption | ✅ **Primary choice** |
| `js2xmlparser` | Simple, no deps | Limited control | ❌ Not flexible enough |
| **Raw String Templates** | Minimal deps, full control | Error-prone escaping | ⚠️ Fallback only |

**Decision**: Use `xmlbuilder2` for Eclipse XML generation with strong escaping/validation.

### ZIP/Packaging
| Library | Pros | Cons | Recommendation |
|---------|------|------|---|
| `adm-zip` | Pure JS, simple API, portable | Slower on large files | ✅ **Primary choice** |
| `jszip` | Popular, modern | Web-focused | ⚠️ Secondary |
| `archiver` | Streaming support, robust | Node.js specific | ⚠️ Consider for scale |

**Decision**: Use `adm-zip` for .vsix packaging (low complexity, no streaming needed yet).

### Validation
- Reuse existing `zod` schema system (already in manifest.ts)
- Create `eclipse-validator.ts` and `vs-validator.ts` for platform-specific checks
- Validate token coverage, color format, plugin metadata

---

## 5. Architecture Decisions

### CLI Command Structure
```bash
# Existing
themebooth export <platform>  # works for sublime, vscode, etc.

# New (Phase 2)
themebooth export eclipse [--version 2023|2024] [--out dir/]
themebooth export vs [--out dir/]
```

### Exporter Structure (Phase 2)
```
src/exporters/
├── eclipse-exporter.ts         # XML theme generation
├── epf-exporter.ts             # .epf preferences generator
├── vs-extension-exporter.ts    # VSIX structure + tokenColors
├── validators/
│   ├── eclipse-validator.ts    # XML + plugin schema
│   └── vs-validator.ts         # tokenColors + manifest validation
```

### Token Mapping Strategy
1. **Base Tokens**: Map manifest.tokens → platform-specific scopes
2. **Semantic Layer**: Use semanticTokens for IDE-native semantic highlighting
3. **Language Overrides**: languageTokens for language-specific refinements
4. **Platform-Specific**: Each exporter translates to native token format

### Eclipse Token Mapping (Phase 2)
- Java: keywords, strings, comments → org.eclipse.jdt.ui.* preferences
- C/C++: code, comments, preprocessor → org.eclipse.cdt.ui.* preferences
- Generic mapping for unspecified languages

### VS Token Mapping (Phase 2)
- Semantic tokens → VS tokenColors array
- Scope chains (e.g., "source.java string.quoted") → regex patterns
- UI colors → shell theme entry points

---

## 6. Version Compatibility Matrix

| Platform | Min Version | Target | LTS Versions | Notes |
|----------|------------|--------|--------------|-------|
| **Eclipse** | 2020.09 | 2023 Q2 | 2021, 2022, 2023, 2024 | Plugin API stable; test on 3 versions |
| **VS** | 2019 | 2022 | 2019, 2022 | Token format break at 2022 |
| **VS 2026** | TBD | 2026 | Semantic tokens only | Future-proof with fallback |

---

## 7. Risk Mitigation

| Risk | Mitigation | Effort |
|------|-----------|--------|
| XML escaping bugs in Eclipse XML | Use xmlbuilder2 (type-safe builder), 100% test coverage | Low |
| .vsix packaging issues | Test extraction, manifest validation, CI integration tests | Medium |
| Token coverage gaps | Map every token type in base manifest → platform equivalents | Medium |
| Version churn (Eclipse/VS SDK) | Version-lock dependencies, test on N-1 and N versions | Medium |
| Complex plugin structure (Eclipse) | Start minimal (color-only), expand incrementally | Low |

---

## 8. Next Steps (Phase 2 Kickoff)

1. **Create Eclipse Exporter** (~1.5 weeks)
   - [x] XML schema design
   - [ ] xmlbuilder2 integration
   - [ ] Plugin scaffold generation
   - [ ] .epf generator
   - [ ] Test coverage

2. **Create VS Exporter** (~2 weeks)
   - [ ] VSIX structure design
   - [ ] adm-zip packaging
   - [ ] Semantic token mapping
   - [ ] Manifest generation
   - [ ] Test coverage

3. **Validation & Testing** (~1 week)
   - [ ] Unit tests (XML/JSON generation edge cases)
   - [ ] Integration tests (optional: import in real IDE)
   - [ ] Compatibility matrix testing
   - [ ] CI/CD integration

---

## References & Resources

### Eclipse
- [Eclipse Color Theme Plugin](https://github.com/eclipse-color-theme/eclipse-color-theme)
- [Eclipse Preferences Guide](https://www.eclipse.org/articles/Article-Preferences/article.html)
- [Eclipse .epf Format](https://www.file-extensions.org/epf-file-extension-eclipse-preference-data)
- [Eclipse Semantic Highlighting](https://help.eclipse.org/latest/topic/org.eclipse.cdt.doc.isv/reference/extension-points/org_eclipse_cdt_ui_semanticHighlighting.html)

### Visual Studio
- [VS VSIX Color Editor](https://learn.microsoft.com/en-us/visualstudio/extensibility/internals/vsix-color-editor)
- [VS Color Theming Tools](https://learn.microsoft.com/en-us/visualstudio/extensibility/internals/color-theming-tools?view=vs-2022)
- [VS Theme Modernization (2026)](https://learn.microsoft.com/en-us/visualstudio/extensibility/migration/modernize-theme-colors)
- [microsoft/VS-ColorThemes Repo](https://github.com/microsoft/VS-ColorThemes)
- [Theme Converter (VS Code → VS 2022)](https://github.com/microsoft/theme-converter-for-vs)

### Libraries
- [xmlbuilder2](https://www.npmjs.com/package/xmlbuilder2) — XML generation
- [adm-zip](https://www.npmjs.com/package/adm-zip) — ZIP packaging
- [zod](https://zod.dev/) — Schema validation (already in use)

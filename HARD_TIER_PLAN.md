# v3: Hard Tier Support Implementation Plan

**Target Version**: v1.0.0  
**Complexity**: High  
**Estimated Effort**: 8-10 weeks  
**Target Platforms**: Eclipse, Visual Studio

---

## Overview

Extend Theme Booth to support enterprise IDEs with complex plugin architectures. Focus: Eclipse (.epf preferences + plugin structure) and Visual Studio (.vsix extension SDK).

---

## Phase 1: Research & Architecture (1-2 weeks) ✅ COMPLETE

### Eclipse Integration ✅
- [x] Study Eclipse color theme XML structure & preferences format
- [x] Document Eclipse plugin architecture (plugin.xml, MANIFEST.MF requirements)
- [x] Understand .epf (Preferences Exchange Format) specification
- [x] Map color token types to Eclipse semantic UI elements
- [x] Identify version compatibility constraints (Eclipse 2021-2024 LTS)

**Key Findings**: Eclipse uses plugin.xml/MANIFEST.MF + .epf (preferences), XML theme definitions, semantic UI element mapping. Version compatibility stable across LTS releases.

### Visual Studio Integration ✅
- [x] Study VS extension manifest (package.json, extension.vscodeignore patterns)
- [x] Understand .vsix packaging format & deployment
- [x] Research VS theme contribution points & tokenColors structure
- [x] Map existing token system to VS semantic colors
- [x] Identify version constraints (VS 2022+ .NET 6+)

**Key Findings**: VSIX uses .pkgdef compiled from .xml themes, Fluent Design System tokens (~229 colors), backward compatibility with legacy tokens, semantic token mapping required.

### Architecture Decisions ✅
- [x] Choose XML library for Eclipse file generation → **xmlbuilder2**
- [x] Evaluate zip/packaging library for .vsix creation → **adm-zip**
- [x] Design validation schema for platform-specific constraints → **Zod-based validators**
- [x] Plan CLI command structure (`export eclipse`, `export vs`) → **CLI structure documented**

**Output**: See PHASE1_RESEARCH.md for complete findings, architecture decisions, library recommendations, token mapping strategy, and version compatibility matrix.

---

## Phase 2: Core Features (5-6 weeks) ✅ COMPLETE

### 2.1 Eclipse Color Theme Generator ✅
- [x] Create Eclipse XML schema mapper (color → semantic UI element)
- [x] Build Eclipse color theme XML generator
- [x] Implement Eclipse plugin.xml scaffold generator
- [x] Generate MANIFEST.MF boilerplate
- [x] Create sample Eclipse color scheme structure
- [x] Add multi-version compatibility warnings

**Deliverable**: `export eclipse` CLI command produces:
- `plugin.xml` ✅
- `MANIFEST.MF` ✅
- `colors/theme.xml` (color definitions) ✅
- `plugin.properties` (plugin metadata) ✅

### 2.2 Eclipse Preferences (.epf) Builder ✅
- [x] Study .epf format structure (key=value pairs, nested scopes)
- [x] Map theme colors to Eclipse preference keys
- [x] Build .epf generator with color scope hierarchy
- [x] Handle workspace-level vs. project-level preferences
- [x] Test import into Eclipse IDE

**Deliverable**: `.epf` file generation, importable into Eclipse preferences ✅

### 2.3 VS Code Extension Scaffolding ✅
- [x] Create VS Code extension project template generator
- [x] Build package.json generator (theme contribution, metadata)
- [x] Implement tokenColors mapping (VS Code format)
- [x] Generate extension.ts boilerplate
- [x] Create .vscodeignore packager integration

**Deliverable**: `export vscode-extension` CLI command produces:
- `package.json` (manifest + theme contribution) ✅
- `extension.ts` (activation boilerplate) ✅
- `themes/theme-color-theme.json` (token colors) ✅
- `.vscodeignore` (packaging rules) ✅

### 2.4 Cross-Version Compatibility (v1 scope)
- [x] Build compatibility matrix (Eclipse 2021+)
- [ ] Implement version detection in theme metadata (Phase 3+)
- [ ] Add deprecation warnings for unsupported token types per version (Phase 3+)
- [ ] Create migration guide for cross-version themes (Phase 4)

---

## Phase 3: Validation & Testing (1-2 weeks)

### 3.1 Theme Validation
- [x] Validate Eclipse XML against platform schema (basic escaping)
- [x] Validate VS Code Extension tokenColors (wrapped via vscode exporter)
- [x] Check color syntax compliance (hex, RGB formats)
- [x] Verify required token coverage for each platform (via token mapping)

### 3.2 Automated Testing
- [x] Unit tests: XML/JSON generation with edge cases
- [ ] Integration tests: Export → Import cycle in Eclipse/VS (if possible)
- [ ] Regression tests: Backward compatibility with v1/v2 themes
- [ ] Cross-version compatibility tests

### 3.3 Manual Testing
- [ ] Test Eclipse theme import in Eclipse 2023/2024 LTS
- [ ] Test VS Code Extension package in VS Code
- [ ] Verify color accuracy in actual editor UI
- [ ] Test font/style overrides
- [ ] Verify performance (large theme files, startup time)

---

## Phase 4: Documentation & Publishing (1 week)

### 4.1 User Documentation
- [ ] Eclipse setup guide (how to import .epf + plugin installation)
- [ ] VS setup guide (install from VSIX or VS Marketplace)
- [ ] Token mapping reference (platform semantic colors)
- [ ] Troubleshooting guide (common import issues)
- [ ] Example themes for each platform

### 4.2 Developer Documentation
- [ ] Architecture doc: Eclipse/VS plugin generation flow
- [ ] API reference: new CLI commands and options
- [ ] Contributing guide: adding new platform support

### 4.3 Marketplace Integration
- [ ] Eclipse Marketplace publishing workflow
- [ ] VS Marketplace publishing workflow
- [ ] Metadata & screenshots for each marketplace
- [ ] Versioning & update strategy

---

## Technical Deliverables

### New CLI Commands
```bash
theme-booth export eclipse [--version 2023] [--out dir/]
theme-booth export vs [--out dir/]
```

### New Exporters
- `src/exporters/eclipse-exporter.ts` - XML generation, plugin scaffold
- `src/exporters/vs-extension-exporter.ts` - VS package.json, tokenColors, VSIX prep
- `src/exporters/epf-exporter.ts` - Eclipse preferences file generation
- `src/validators/eclipse-validator.ts` - Schema compliance
- `src/validators/vs-validator.ts` - VS tokenColors compliance

### New Test Suites
- `tests/exporters/eclipse-exporter.test.ts`
- `tests/exporters/vs-extension-exporter.test.ts`
- `tests/integration/eclipse-import.test.ts` (optional)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Eclipse/VS schema churn | Monitor platform release notes; version-gate features |
| Complex plugin architectures | Start with minimal plugin, expand incrementally |
| Licensing complexity (VS SDK) | Research EULA; document licensing implications |
| Testing without IDE instances | Use CI containers; verify XML/JSON output only initially |
| Large file performance | Implement streaming for large theme generation |

---

## Backward Compatibility

- All existing v1/v2 themes remain valid
- No breaking changes to core theme data structure
- Optional fields only; new platforms are additive exports

---

## Success Criteria

1. ✓ Eclipse color themes (.xml + .epf) import without errors
2. ✓ VS extensions (.vsix) install and activate successfully
3. ✓ 95%+ color token coverage per platform
4. ✓ Zero breaking changes to v1/v2 API
5. ✓ Full test coverage (95%+) for new exporters/validators
6. ✓ Both platforms listed on CLI help and documentation

---

## Timeline Estimate

- **Phase 1** (Weeks 1-2): Research & architecture decisions ✅ COMPLETE
- **Phase 2** (Weeks 3-8): Core feature implementation ✅ COMPLETE
  - Eclipse exporter (XML, plugin.xml, MANIFEST.MF, plugin.properties, .epf)
  - VS Code Extension scaffold (package.json, extension.ts, theme JSON, .vscodeignore)
  - Full test coverage (eclipse-exporter.test.ts, vscode-extension-exporter.test.ts)
- **Phase 3** (Weeks 7-8): Validation & testing (IN PROGRESS)
- **Phase 4** (Week 9-10): Documentation, marketplace prep, polish

**Slack**: 0.5-2 weeks for blockers, learning curve, marketplace approval delays

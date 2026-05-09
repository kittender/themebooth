# Theme Booth v1 Implementation Plan

**Goal**: Build a CLI tool that lets users create syntax themes once and publish to VS Code, Notepad++, and Zed with zero per-editor config boilerplate.

**Scope**: v1 targets VS Code, Notepad++, and Zed only. Single JSON manifest definition. No per-editor configuration files.

---

## Status

**v1 Implementation**: ✓ Complete
- Core CLI (init, preview, package, publish) ✓
- Manifest schema + validation ✓
- Live preview with hot-reload ✓
- Transpilers for VS Code, Notepad++, Zed ✓
- 3 preset themes (dark, light, high-contrast) ✓
- Publishing workflows for all platforms ✓
- 71 tests passing ✓

---

## Remaining TODOs

### 1. Publish to npm (CRITICAL)
- [ ] Run `npm publish` to release `themebooth@0.1.0`
- [ ] Verify package is accessible via `npm install -g themebooth`
- [ ] Tag release in git: `git tag v0.1.0`

### 2. Create `.npmignore`
- [ ] Exclude internal docs (PLAN.md, TEST_PLAN.md, SCHEMA_IMPLEMENTATION.md)
- [ ] Exclude source (src/, test.js)
- [ ] Keep only README.md, dist/, and license

### 3. Cleanup Documentation
- [ ] Delete PLAN.md (or archive to HISTORY.md)
- [ ] Delete TEST_PLAN.md
- [ ] Delete SCHEMA_IMPLEMENTATION.md
- [ ] Delete MANIFEST.md (duplicate of MANIFEST_SCHEMA.md)
- [ ] Keep: README.md, MANIFEST_SCHEMA.md, CLI_HELP.md, TROUBLESHOOTING.md, CONTRIBUTING.md
- [ ] Optionally move ROADMAP.md to wiki or FUTURE.md

---

## Future: v2 (Medium Tier Support)

Target: Sublime Text, IntelliJ IDEA, PyCharm

**Goals:**
- Multi-file theme structures
- XML + JSON configurations
- Plugin metadata generation
- JetBrains Marketplace integration
- Sublime Package Control publishing

**Complexity:** Medium
**Estimated Effort:** 4-6 weeks

---

## Future: v3 (Hard Tier Support)

Target: Eclipse, Visual Studio

**Goals:**
- Enterprise plugin system support
- Complex XML preference structures
- Eclipse preferences (.epf) generation
- VS extension SDK integration
- Theme validation against target platform specs
- Full plugin build & deployment pipelines

**Complexity:** High
**Estimated Effort:** 8-10 weeks

---

## Future: Quality of Life Enhancements

- Dark/light mode variant generator
- Accessibility validation (WCAG contrast)
- Theme migration tools (format conversion)
- Color picker UI in preview
- Theme marketplace/registry browsing
- OS keychain support for credentials (instead of prompting each time)

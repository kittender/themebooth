# Theme Booth Roadmap

## v1: Easy Tier Support
Target: VS Code, Notepad++, Zed

**Goals:**
- Simple JSON-based theme editor
- Quick theme creation from templates
- Direct publishing to marketplaces (VS Code Marketplace, Package Control, Zed registry)
- Single-file theme export
- Live preview of changes
- Built-in syntax highlighting presets

**Core Features:**
- Theme builder UI (color palette, token mapping)
- Export to .json/.xml formats for target editors
- Templates for each easy-tier editor
- Documentation for one-click publishing

**Complexity:** Low
**Estimated Effort:** ~2-3 weeks

---

## v2: Medium Tier Support
Target: Sublime Text, IntelliJ IDEA, PyCharm

**Goals:**
- Support multi-file theme structures
- Handle XML + JSON configurations
- Plugin metadata generation (plugin.xml, extension.toml)
- Package building workflows
- JetBrains Marketplace integration
- Sublime Package Control publishing

**Core Features:**
- Multi-file theme templates
- Editor scheme XML generation (for IntelliJ/PyCharm)
- Color scheme export (.icls format support)
- Build system integration
- Plugin.xml boilerplate generator
- Publishing workflow docs for each platform

**Breaking Changes:** None (backward compatible with v1)
**Complexity:** Medium
**Estimated Effort:** ~4-6 weeks

---

## v3: Hard Tier Support
Target: Eclipse, Visual Studio

**Goals:**
- Enterprise plugin system support
- Complex XML preference structures
- Eclipse preferences (.epf) generation
- VS extension SDK integration
- Theme validation against target platform specs
- Full plugin build & deployment pipelines

**Core Features:**
- Eclipse color theme (.xml) + plugin structure generator
- VS extension project scaffolding (.vsix packaging)
- Preference file (.epf) builder for Eclipse
- Cross-version compatibility checks
- Automated testing for theme rendering
- CI/CD integration templates

**Breaking Changes:** None (backward compatible with v1-v2)
**Complexity:** High
**Estimated Effort:** ~8-10 weeks

---

## Future Considerations
- Accessibility validation (WCAG contrast ratios)
- Dark/light mode variants generator
- Theme migration tools (convert between formats)

# Contributing to Theme Booth

Thank you for your interest in contributing! This document outlines how to help.

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Setup

```bash
git clone https://github.com/kittender/themebooth.git
cd themebooth
npm install
npm run dev  # Watch TypeScript compilation
```

### Project Structure

```
src/
├── bin/              # CLI entry point
├── cli/              # Command implementations (init, preview, package, publish)
├── core/             # Core logic (manifest validation, variable resolution)
├── exporters/        # Platform-specific transpilers (VS Code, Notepad++, Zed)
├── preview/          # Live preview server
├── templates/        # Built-in presets and templates
├── publish/          # Marketplace publishing flows
└── utils/            # Helpers (logger, paths)
```

## Development Workflow

### Build & Test

```bash
npm run build    # Compile TypeScript to dist/
npm test         # Run Jest test suite
npm run dev      # Watch mode (auto-recompile on save)
```

### Testing

Tests are located in `src/__tests__/` and follow Jest conventions:

```bash
npm test                          # Run all tests
npm test -- --watch              # Watch mode
npm test -- --coverage           # Coverage report
npm test integration.test.ts      # Run specific test file
```

**Test categories**:
- **Unit tests**: Core logic (validation, variables, color parsing)
- **Integration tests**: Full workflows (init → package → publish)
- **Exporters**: Platform-specific transpilers

When adding features, include tests in `src/__tests__/`.

### Code Style

- TypeScript strict mode enabled
- No console.log—use logger.info/warn/error
- Comments only for non-obvious "why", not "what"
- Prefer immutability

Example:
```typescript
// Good: Uses logger, clear intent
const validation = validateManifest(manifest);
if (!validation.success) {
  logger.error(`Invalid manifest: ${validation.error.message}`);
  return;
}

// Avoid: console.log, obvious comments
console.log("Validating manifest");  // ❌ Obvious what it does
const validation = validateManifest(manifest);
```

## Making Changes

### 1. Pick an Issue or Create One

Look for `good first issue` or `help wanted` labels. Feel free to open an issue for bugs or feature requests.

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

- Keep commits atomic and well-message
- Update tests as needed
- Run `npm test` before committing

### 4. Test Your Changes

```bash
npm run build
npm test

# Manual testing (if applicable)
cd /tmp
themebooth init test-theme --preset dark
cd test-theme
themebooth preview  # Ctrl+C to quit
themebooth package
themebooth publish vscode  # Test flow (don't actually publish)
```

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub with:
- Clear title
- Description of changes
- Link to related issue (if applicable)
- Manual testing notes (if applicable)

## Areas for Contribution

### Bugs
- File an issue with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Node version and OS
  - Manifest JSON (if applicable)

### Features
- **Preset templates**: Add new dark/light/high-contrast variants
- **Color validation**: Enhanced contrast checking, accessibility features
- **Documentation**: Improve guides, add examples, fix typos
- **Performance**: Optimize file watching, transpilation speed
- **Error messages**: Make them clearer and more actionable

### Low-Hanging Fruit
- Update README with new examples
- Add missing JSDoc comments
- Improve error messages
- Add unit tests for edge cases
- Create troubleshooting guides

## Release Process

When ready for release:

1. Update `version` in `package.json` (semver)
2. Update `CHANGELOG.md` with changes
3. Commit: `git commit -m "v1.2.3"`
4. Tag: `git tag v1.2.3`
5. Push: `git push origin main --tags`

GitHub Actions will run tests and publish to npm automatically.

## Questions?

- GitHub Issues: For bugs and features
- Discussions: For questions and ideas
- Email: Check repo for contact info

Thanks for contributing!

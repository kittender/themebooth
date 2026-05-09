# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-09

### Added
- Comprehensive validation CLI command with detailed error reporting
- Color utility module for advanced color manipulation and validation
- Theme overlay system for composing multiple theme layers
- Schema definitions extracted into dedicated module
- New editor exporters: Atom, Brackets, Sublime Text, and Vim
- Exporter utilities for shared functionality across editor formats
- Extensive test plan and CLI help documentation
- Troubleshooting guide with common issues and solutions

### Changed
- Refactored preview renderer with expanded browser UI (>2200 lines)
- Enhanced exporter interfaces for VS Code and Zed with improved format handling
- Updated manifest template with computed field support
- Improved preset templates (dark, light, high-contrast) with better color definitions
- Refined variables.ts with cleaner type definitions
- Enhanced validation utilities with extended error context

### Fixed
- Computed field initialization in manifest generation
- ColorOrVariableRegex import source consistency

## [0.2.1] - 2026-05-09

### Added
- Phase 3: Theme inheritance, computed colors, and preset wizard
- ASCII mascot and colorized output for CLI init command
- Complete testing and documentation workflows
- Comprehensive error handling and validation system

## [0.2.0] - 2026-05-09

### Added
- Core schema validation with Zod
- Preview command with browser live-reload
- Package and publish commands
- VS Code and Zed exporter implementations
- Dark, light, and high-contrast preset templates
- Browser-based validation error visualization

## [0.1.0] - 2026-05-08

### Added
- Initial release
- Basic CLI with init command
- Theme manifest schema
- Variable substitution system
- IntelliJ and Sublime basis implementation

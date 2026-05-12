# Sublime Text Theme Export Guide

This guide walks through exporting and publishing Sublime Text color schemes using themebooth.

## Table of Contents

1. [Export Formats](#export-formats)
2. [Exporting Your Theme](#exporting-your-theme)
3. [Understanding the Output](#understanding-the-output)
4. [Creating a Package](#creating-a-package)
5. [Publishing to Package Control](#publishing-to-package-control)
6. [Testing Your Theme](#testing-your-theme)

## Export Formats

Themebooth exports Sublime Text themes in modern JSON format (`.sublime-color-scheme`), which is the standard for Sublime Text 4+.

### Color Scheme (`.sublime-color-scheme.json`)
Defines syntax highlighting colors and scopes:
- Token colors (keywords, strings, comments, etc.)
- Editor globals (background, foreground, caret, selection)
- Optional UI theme customization

### UI Theme (`.sublime-theme.json`)
Customizes Sublime's user interface:
- Button styles
- Panel colors
- Menu colors
- Sidebar styling

### Metadata (`metadata.json`)
Theme information for Package Control:
- Theme name and description
- Author
- Version
- License

## Exporting Your Theme

### Quick Export

Export just the color scheme to a directory:

```bash
themebooth export sublime
```

This creates:
- `{theme-name}.sublime-color-scheme.json`
- `{theme-name}.sublime-theme.json`
- `metadata.json`

### Custom Output Directory

```bash
themebooth export sublime -o /path/to/output
```

### Bundled Package Export

Create a complete package structure ready for submission:

```bash
themebooth export-sublime-package
```

Options:
- `-n, --name <name>` — Package name (default: `sublime-{theme-name}`)
- `-o, --output <path>` — Custom output directory
- `--url <url>` — Repository URL for Package Control
- `--homepage <url>` — Homepage URL
- `--dev` — Create development package (adds `.no-sublime-package`)

Example:

```bash
themebooth export-sublime-package \
  -n my-awesome-theme \
  --url https://github.com/user/my-awesome-theme
```

## Understanding the Output

### Color Scheme Structure

```json
{
  "name": "My Theme",
  "author": "Your Name",
  "variables": {
    "red": "#ff5555",
    "green": "#55ff55"
  },
  "globals": {
    "background": "#1e1e1e",
    "foreground": "#d4d4d4",
    "line_highlight": "#ffffff10",
    "selection": "#264f78",
    "caret": "#aeafad"
  },
  "rules": [
    {
      "name": "Comment",
      "scope": "comment",
      "foreground": "#6a9955"
    },
    {
      "name": "String",
      "scope": "string",
      "foreground": "#ce9178"
    }
  ]
}
```

### Global Variables

Common Sublime Text global variables:

| Variable | Purpose |
|----------|---------|
| `background` | Editor background color |
| `foreground` | Default text color |
| `caret` | Cursor color |
| `line_highlight` | Current line highlight |
| `selection` | Selection background |
| `gutter_background` | Line number gutter background |
| `gutter_foreground` | Line number gutter text |
| `invisibles` | Whitespace characters |

### Token Scopes

Sublime uses TextMate-style scopes. Common ones:

- `comment` — Comments
- `string` — Strings
- `string.regexp` — Regular expressions
- `keyword` — Keywords
- `keyword.operator` — Operators
- `constant` — Constants
- `constant.numeric` — Numbers
- `variable` — Variables
- `variable.parameter` — Function parameters
- `entity.name.function` — Function names
- `entity.name.class` — Class names
- `markup.heading` — Markdown headings
- `markup.bold` — Bold text
- `markup.italic` — Italic text

## Creating a Package

### Manual Package Structure

```
my-theme/
├── color-schemes/
│   └── my-theme.sublime-color-scheme.json
├── themes/
│   └── my-theme.sublime-theme.json
├── messages/
│   └── install.txt
└── packages.json
```

### Using Export Command

The `export-sublime-package` command creates this structure automatically:

```bash
themebooth export-sublime-package --name my-theme
```

### Development vs. Release

For development, add `.no-sublime-package` file to the package directory to prevent Sublime from zipping it:

```bash
themebooth export-sublime-package --dev
```

This lets you test locally before release.

## Publishing to Package Control

### Prerequisites

1. **GitHub Repository** — Themes must be publicly available on GitHub
2. **Version Tag** — Create Git tags for releases (e.g., `v1.0.0`)
3. **Theme Files** — Export files must be in the repository

### Step-by-Step

#### 1. Prepare Your Repository

```bash
# Initialize Git if needed
git init

# Add theme files
git add color-schemes/ themes/ metadata.json

# Commit
git commit -m "Initial theme release"

# Create version tag
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

#### 2. Generate Package Control Entry

```bash
themebooth publish sublime
```

This generates:
- An interactive prompt for repository URL
- A JSON entry formatted for Package Control's `repository.json`
- Saves entry to `{theme-name}-package-control.json`

Copy the generated JSON entry.

#### 3. Submit to Package Control

1. Fork https://github.com/wbond/package_control_channel
2. Clone your fork locally
3. Edit `repository.json` and add your theme entry
4. Create a pull request to the original repository

Example entry:

```json
{
  "name": "My Awesome Theme",
  "description": "A beautiful color scheme for Sublime Text",
  "author": "Your Name",
  "homepage": "https://github.com/user/my-awesome-theme",
  "previous_names": [],
  "labels": ["color-scheme", "theme"],
  "releases": [
    {
      "version": "1.0.0",
      "date": "2024-01-15",
      "url": "https://github.com/user/my-awesome-theme/releases/tag/v1.0.0",
      "sublime_text": ">=4000"
    }
  ]
}
```

#### 4. After Approval

Once approved, users can install with:

```
Sublime Text → Command Palette → Package Control: Install Package → My Awesome Theme
```

### Updating Your Theme

For new releases:

1. Update `version` in `manifest.json`
2. Export and test
3. Commit and tag:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```
4. Submit new entry to Package Control with updated version

## Testing Your Theme

### In Sublime Text (Local)

1. **Export to user package directory:**

   macOS:
   ```bash
   themebooth export sublime -o ~/Library/Application\ Support/Sublime\ Text/Packages/User
   ```

   Linux:
   ```bash
   themebooth export sublime -o ~/.config/sublime-text/Packages/User
   ```

   Windows:
   ```bash
   themebooth export sublime -o %APPDATA%\Sublime\ Text\Packages\User
   ```

2. **Restart Sublime Text**

3. **Select theme:**
   - Preferences → Color Scheme → {Your Theme Name}

### Using `.no-sublime-package`

For active development:

```bash
themebooth export-sublime-package --dev
```

Symlink to Sublime's package directory and reload on manifest changes:

```bash
ln -s ./my-theme ~/Library/Application\ Support/Sublime\ Text/Packages/my-theme
```

Then in Sublime: `View → Reload Color Scheme`

### Verify Scopes

Use Sublime's scope tester:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
2. Search "Show Scope Name"
3. Move cursor over code to see active scopes

This helps verify your token scope definitions.

## Troubleshooting

### Theme Not Appearing

- Ensure color scheme is in `color-schemes/` subdirectory
- Check file has `.sublime-color-scheme.json` extension
- Restart Sublime Text
- Clear cache: `Preferences → Packages → Browse Packages` and remove cache files

### Colors Not Applying

- Verify scope names match TextMate conventions
- Check `globals` keys are valid Sublime variables
- Ensure hex colors are valid (start with `#`)

### Package Control Submission Rejected

Common reasons:
- Repository URL points to wrong branch
- Version tag doesn't exist in repository
- Missing required metadata in `packages.json`
- Theme files not accessible in release

### Development Package Not Reloading

- Ensure `.no-sublime-package` file exists in root
- Check symlink points to correct directory
- Use `View → Reload Color Scheme` to force reload
- Check Sublime console for errors: ``Ctrl+` ``

## Resources

- [Sublime Text Color Scheme Docs](https://www.sublimetext.com/docs/color_schemes.html)
- [Package Control Documentation](https://packagecontrol.io/)
- [TextMate Scope Reference](https://macromates.com/manual/en/language_grammars)
- [Sublime Forum](https://forum.sublimetext.com/) — Ask for theme help

## Examples

### Viewing an Installed Theme

```bash
# List installed packages
subl --command list_packages

# Open a theme file
subl ~/Library/Application\ Support/Sublime\ Text/Packages/YourTheme
```

### Creating a GitHub Release

```bash
# Create release with theme file attached
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Then upload file via GitHub web UI
```

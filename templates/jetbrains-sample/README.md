# JetBrains One Dark Pro Theme Template

This is a complete working example of a JetBrains theme for Themebooth.

## Files

- **manifest.json** - Base theme definition with variables, colors, and token styles
- **jetbrains.json** - JetBrains-specific overrides and adjustments

## Using This Template

### 1. Copy to your theme project

```bash
# Copy this entire directory as your theme
cp -r templates/jetbrains-sample my-theme
cd my-theme
```

### 2. Customize

Edit `manifest.json` to change:
- `name` - Your theme name
- `author` - Your name
- `version` - Version number (semver)
- `description` - What your theme does
- `variables` - Base colors (reusable)
- `colors` - Editor UI colors
- `tokens` - Syntax highlighting

Edit `jetbrains.json` to customize:
- Colors specific to JetBrains
- Font styles (bold, italic)
- Additional semantic token mapping

### 3. Test locally

```bash
# Build
npm run build

# Export
themebooth export intellij

# Copy to your IDE
# (see jetbrains-export.md for paths)
```

## Color Variables

Variables start with `$` and can be reused:

```json
{
  "variables": {
    "darkBg": "#1e1e1e",
    "lightFg": "#d4d4d4"
  },
  "colors": {
    "editor.background": "$darkBg",
    "editor.foreground": "$lightFg"
  }
}
```

## Token Mapping

Token scopes are automatically mapped to JetBrains semantic tokens:

| Scope | Maps To |
|-------|---------|
| keyword | KEYWORD |
| string | STRING |
| comment | COMMENTS |
| function | FUNCTION_DECLARATION / FUNCTION_CALL |
| variable | LOCAL_VARIABLE |
| class | CLASS_NAME |

See [jetbrains-export.md](../../docs/jetbrains-export.md#scope-to-semantic-token-mapping) for complete mapping.

## Font Styles

Supported font styles in `fontStyle`:
- `bold` - Bold text
- `italic` - Italic text
- `bold italic` - Bold and italic (space-separated)

Example:
```json
{
  "tokens": {
    "comment": {
      "foreground": "#6a9955",
      "fontStyle": "italic"
    },
    "keyword": {
      "foreground": "#569cd6",
      "fontStyle": "bold"
    }
  }
}
```

## Publishing

Once your theme is ready:

1. Export: `themebooth export-intellij-package`
2. Create JAR: `zip -r my-theme.jar *`
3. Submit to [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/submit)

See [jetbrains-marketplace.md](../../docs/jetbrains-marketplace.md) for detailed instructions.

## Tips

- Use a color picker to find good combinations
- Test in multiple IDE versions
- Check accessibility (contrast ratios)
- Include screenshots in marketplace listing
- Update regularly with user feedback

## Resources

- [Complete Export Guide](../../docs/jetbrains-export.md)
- [Marketplace Submission Guide](../../docs/jetbrains-marketplace.md)
- [JetBrains Plugin SDK](https://plugins.jetbrains.com/docs/intellij/)
- [Color Scheme Reference](https://plugins.jetbrains.com/docs/intellij/color-scheme-structure.html)

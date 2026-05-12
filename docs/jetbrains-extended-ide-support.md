# Extended JetBrains IDE Support

Themebooth themes created with the IntelliJ export work across the entire JetBrains ecosystem without any modifications.

## Supported IDEs

All these IDEs use the same `.icls` (IntelliJ Color Scheme XML) format:

### Desktop IDEs

| IDE | Version | Status | Use Case |
|-----|---------|--------|----------|
| **IntelliJ IDEA** | 2021.1+ | ✓ Full Support | Java, Kotlin, general development |
| **PyCharm** | 2021.1+ | ✓ Full Support | Python development |
| **WebStorm** | 2021.1+ | ✓ Full Support | JavaScript, TypeScript, web development |
| **Rider** | 2021.1+ | ✓ Full Support | .NET, C# development |
| **CLion** | 2021.1+ | ✓ Full Support | C/C++ development |
| **GoLand** | 2021.1+ | ✓ Full Support | Go development |
| **RubyMine** | 2021.1+ | ✓ Full Support | Ruby development |
| **PhpStorm** | 2021.1+ | ✓ Full Support | PHP development |

### Cloud IDEs

| IDE | Status | Notes |
|-----|--------|-------|
| **JetBrains Space** | ✓ Supported | Cloud-based development environment |
| **GitPod** | ✓ Supported | With JetBrains backend |

## No Modifications Needed

Your exported `.icls` file works identically in all JetBrains IDEs. No special configuration or overlay files are required per IDE.

### One Export, Every IDE

```bash
# Generate once
themebooth export intellij

# Use in any JetBrains IDE:
# - IntelliJ IDEA
# - PyCharm
# - WebStorm
# - Rider
# - CLion
# - GoLand
# - RubyMine
# - PhpStorm
```

## Installation Path Differences

Each IDE stores settings in a different directory, but the color scheme file is the same:

**macOS:**
```bash
# IntelliJ IDEA
~/Library/Application Support/JetBrains/IntelliJIdea2024.1/colors/

# PyCharm
~/Library/Application Support/JetBrains/PyCharm2024.1/colors/

# WebStorm
~/Library/Application Support/JetBrains/WebStorm2024.1/colors/

# Rider
~/Library/Application Support/JetBrains/Rider2024.1/colors/
```

**Linux:**
```bash
# IntelliJ IDEA
~/.config/JetBrains/IntelliJIdea2024.1/colors/

# PyCharm
~/.config/JetBrains/PyCharm2024.1/colors/

# WebStorm
~/.config/JetBrains/WebStorm2024.1/colors/

# Rider
~/.config/JetBrains/Rider2024.1/colors/
```

**Windows:**
```cmd
# IntelliJ IDEA
%APPDATA%\JetBrains\IntelliJIdea2024.1\colors\

# PyCharm
%APPDATA%\JetBrains\PyCharm2024.1\colors\

# WebStorm
%APPDATA%\JetBrains\WebStorm2024.1\colors\

# Rider
%APPDATA%\JetBrains\Rider2024.1\colors\
```

## Language-Specific Advantages

While your theme works the same in all IDEs, different IDEs highlight different languages. Choose the right IDE for your language:

### Python Development
Use **PyCharm** for the best Python syntax highlighting and IDE features.

```python
# PyCharm shows Python-specific scopes:
# - python.keyword, python.builtin, python.magic
# All use your theme colors
```

### JavaScript/TypeScript Development
Use **WebStorm** for JavaScript, TypeScript, and web framework support.

```javascript
// WebStorm highlights JavaScript semantic tokens:
// - javascript.string, typescript.type, react.tag
// All use your theme colors
```

### C# / .NET Development
Use **Rider** for the best .NET development experience.

```csharp
// Rider shows .NET-specific scopes:
// - csharp.keyword, csharp.type, csharp.namespace
// All use your theme colors
```

### General Development
Use **IntelliJ IDEA** for multi-language support (Java, Kotlin, Python, JavaScript, etc.)

## Marketplace Submission

Submit your theme **once** to the JetBrains Marketplace, and it's available in all IDEs.

### Single Submission

1. Create plugin at https://plugins.jetbrains.com/plugin/submit
2. Mark IDE version as `since-build="211.0"` (or later for broad compatibility)
3. In the marketplace submission form, your plugin is available to all IDEs using that version

### Automatic Distribution

Once published:
- Users in **IntelliJ IDEA** can install it
- Users in **PyCharm** can install the same plugin
- Users in **WebStorm**, **Rider**, etc. can all install it
- No separate submissions needed

## Customization Per IDE (Optional)

For advanced use cases, create IDE-specific overlays:

```json
// jetbrains.json (all IDEs)
{
  "inherits": "base",
  "colors": { ... }
}

// pycharm.json (Python-specific, optional)
{
  "inherits": "jetbrains",
  "tokenOverrides": {
    "python.keyword": { "fontStyle": "bold" }
  }
}

// webstorm.json (JavaScript-specific, optional)
{
  "inherits": "jetbrains",
  "tokenOverrides": {
    "javascript.string": { "foreground": "#custom-color" }
  }
}
```

*Note: Currently, Themebooth treats all JetBrains IDEs the same. Language-specific overlays require manual configuration outside of Themebooth.*

## Version Compatibility

### Current Support Matrix

| Build Version | Release | IDEs Included |
|---------------|---------|---------------|
| 211.x | 2021.1 | All major IDEs |
| 212.x | 2021.2 | All major IDEs |
| 213.x | 2021.3 | All major IDEs |
| 221.x | 2022.1 | All major IDEs |
| 222.x | 2022.2 | All major IDEs |
| 223.x | 2022.3 | All major IDEs |
| 231.x | 2023.1 | All major IDEs |
| 232.x | 2023.2 | All major IDEs |
| 233.x | 2023.3 | All major IDEs |
| 241.x | 2024.1 | All major IDEs |

Set your `plugin.xml` to:
```xml
<!-- Broadest compatibility -->
<idea-version since-build="211.0" />

<!-- Support 2023.3 and later -->
<idea-version since-build="233.0" />
```

## Testing Across Multiple IDEs

### Quick Test Checklist

1. **Install in one IDE** (e.g., IntelliJ IDEA)
   - Verify colors are correct
   - Check token highlighting
   - Test with multiple file types

2. **Install in another IDE** (e.g., PyCharm)
   - Same `.icls` file works
   - Colors match IntelliJ IDEA
   - Language-specific highlighting works

3. **Verify in a third IDE** (e.g., WebStorm)
   - Confirm consistency
   - Test with web frameworks
   - Check TypeScript highlighting

## Troubleshooting

### Theme appears in one IDE but not another

1. Check IDE version is 2021.1 or later
2. Verify `.icls` file is in correct colors directory for that IDE
3. Restart IDE (color schemes are cached on startup)
4. Try **File > Invalidate Caches** (IntelliJ/WebStorm/PyCharm/Rider)

### Colors differ between IDEs

This shouldn't happen—the same `.icls` file is used. If you notice differences:

1. Check that the exact same `.icls` file is in each IDE's colors directory
2. Some IDEs may apply different font rendering (affecting perceived color)
3. IDE-specific plugins may modify colors (disable them to test)

### Plugin submission works for one IDE but not others

1. Verify `<idea-version since-build="211.0" />` in your `plugin.xml`
2. Check plugin ID is unique across all IDEs (it is—plugins are global)
3. If rejected, read the rejection reason; it applies to all IDEs

## Best Practices

1. **Design for consistency**
   - Test your theme in at least 2-3 different IDEs
   - Ensure token mapping works across language types

2. **Support latest + one previous version**
   - Use `since-build="233.0"` to support 2023.3 and later
   - Consider supporting back to 2022.3 for broader user base

3. **Include language-agnostic colors**
   - Define colors that work for keywords, strings, comments, functions across all languages
   - Avoid language-specific token names unless you're OK with some IDEs ignoring them

4. **Document supported languages**
   - In your marketplace listing, mention which IDEs are recommended
   - "Best with PyCharm for Python, WebStorm for JavaScript"

## Summary

✓ One `.icls` file for all IDEs  
✓ One plugin submission to the marketplace  
✓ Installed in IntelliJ IDEA, PyCharm, WebStorm, Rider, CLion, GoLand, RubyMine, PhpStorm  
✓ Colors work identically everywhere  
✓ No IDE-specific code or configuration needed  

See [jetbrains-marketplace.md](./jetbrains-marketplace.md) for submission instructions.

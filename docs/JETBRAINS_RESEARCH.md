# JetBrains .icls and plugin.xml Format Research

## Task 1.1: .icls Color Scheme XML Structure

### Overview
`.icls` files (IntelliJ Color Scheme XML) define color schemes for JetBrains IDEs. Structure based on official documentation and existing themes.

### XML Root Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<scheme name="{themeName}" version="142" parent_scheme="Default" />
```

### Global Color Options (Metadata)
Located at root level, `<option>` elements define editor-wide colors and behaviors:

**Core Editor Colors:**
- `CARET_COLOR`: Cursor color
- `CARET_ROW_COLOR`: Current line highlight
- `SELECTION_BACKGROUND`: Text selection color
- `SELECTION_FOREGROUND`: Selected text color
- `FOREGROUND`: Default text foreground
- `BACKGROUND`: Editor background
- `LINE_NUMBERS_COLOR`: Line number gutter color
- `GUTTER_BACKGROUND`: Gutter area background
- `INDENT_GUIDE_COLOR`: Indentation guide color
- `WHITESPACE`: Whitespace character color

**UI Elements:**
- `DIFF_SEPARATORS_BACKGROUND`
- `ERROR_HASH_BACKGROUND`
- `FILESTATUS_*`: Modified file status colors

**Format:** `<option name="OPTION_NAME" value="#RRGGBB" />`

### Token Attributes Section
Located in `<attributes>` element. Defines syntax highlighting for token types.

**Structure:**
```xml
<attributes>
  <attributesGroup name="MARKUP_ENTITIES">
    <attribute name="MARKUP_ENTITY" baseAttribute="KOTLIN_KEYWORD" />
  </attributesGroup>
  <attributesGroup name="COMMENTS">
    <attribute name="COMMENTS" value="..." />
    <attribute name="COMMENTS.BLOCK_COMMENT" value="..." />
  </attributesGroup>
</attributes>
```

**Attribute Definition Formats:**
1. **Base Attribute Reference:**
   - `baseAttribute="NAME"` (inherit from existing attribute)

2. **Inline Styling:**
   - `value="{...}"` (JSON-like object string)
   ```xml
   <attribute name="KEYWORD" value="{&quot;effectType&quot;:&quot;null&quot;,&quot;foreground&quot;:&quot;569cd6&quot;}" />
   ```

3. **Font Styles:**
   - Font styles embedded in value: `&quot;fontStyle&quot;:&quot;1&quot;` (bold) or `&quot;2&quot;` (italic), `&quot;4&quot;` (underline)

### Common Token Groups
- `KEYWORD` / `KOTLIN_KEYWORD`
- `STRING` / `STRING_LITERAL`
- `COMMENTS` / `COMMENTS.LINE_COMMENT`
- `NUMBER` / `NUMBERS`
- `FUNCTION_DECLARATION` / `FUNCTION_CALL`
- `CLASS_NAME` / `CLASS_DECLARATION`
- `VARIABLE` / `LOCAL_VARIABLE`
- `CONSTANT`
- `XML_TAG` / `XML_ATTRIBUTE_NAME`
- `MARKUP_TAG` / `MARKUP_ATTRIBUTE`

### Color Inheritance
- Attributes can inherit from parent attributes
- Parent scheme specified at root: `parent_scheme="Default"`
- Helps maintain compatibility across IDE updates

### Font Style Flags
- `1` = Bold
- `2` = Italic
- `4` = Underline
- `0` = None

---

## Task 1.2: plugin.xml Plugin Descriptor

### Purpose
`plugin.xml` is the plugin manifest describing the theme package to JetBrains IDEs.

### Root Element
```xml
<idea-plugin>
  <!-- plugin metadata -->
  <!-- dependencies -->
  <!-- extensions -->
</idea-plugin>
```

### Required Metadata Elements

```xml
<id>com.example.themeName</id>
<name>My Theme Name</name>
<version>1.0.0</version>
<vendor email="author@example.com" url="https://example.com">Author Name</vendor>
<description>Theme description</description>
<change-notes>Version 1.0.0: Initial release</change-notes>
```

### IDE Version Compatibility
```xml
<idea-version since-build="211.0" until-build="241.0" />
```
- `since-build`: Minimum IDE build number (211 = 2021.1)
- `until-build`: Maximum IDE build (optional)
- Modern IntelliJ: 211.* to 243.* range

### Theme Extension Registration
```xml
<extensions defaultExtensionNs="com.intellij">
  <themeProvider path="/theme/MyTheme.theme.json" />
</extensions>
```
- `path` attribute points to theme file location in plugin JAR
- File can be `.icls` or `.theme.json` (newer format)
- Relative to plugin root or `/` in JAR

### Optional Metadata
```xml
<url>https://github.com/user/theme</url>
<category>UI Themes</category>
<product-descriptor code="TIC" release-date="20240101" release-version="1" />
```

### Depends (Optional)
```xml
<depends>com.intellij.modules.lang</depends>
```
- Declare dependencies on other plugins or modules
- Usually not needed for themes

### Application Components (Rarely needed)
```xml
<applicationListeners>
  <listener class="..." />
</applicationListeners>
```

### Example Complete plugin.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<idea-plugin>
  <id>com.example.mytheme</id>
  <name>My Theme</name>
  <version>1.0.0</version>
  <vendor email="author@example.com">Author Name</vendor>
  <description>A beautiful theme for IntelliJ IDEA</description>
  <change-notes>Initial release</change-notes>
  <idea-version since-build="211.0" />
  <extensions defaultExtensionNs="com.intellij">
    <themeProvider path="/theme/MyTheme.icls" />
  </extensions>
</idea-plugin>
```

---

## Mapping Strategy: Themebooth → JetBrains

### From Manifest.tokens → IJAttribute Elements
Themebooth token scopes map to IntelliJ attribute names:

| Themebooth Scope | IntelliJ Attribute |
|------------------|-------------------|
| keyword | KEYWORD |
| string | STRING |
| comment | COMMENTS / COMMENTS.LINE_COMMENT |
| function | FUNCTION_DECLARATION / FUNCTION_CALL |
| variable | LOCAL_VARIABLE |
| class | CLASS_NAME |
| constant | CONSTANT |
| operator | OPERATION_SIGN |
| number | NUMBER |
| type | CLASS_NAME |

### From Manifest.colors → plugin.xml / Global Options
Editor colors map to `<option>` elements:

| Themebooth Color | JetBrains Option |
|------------------|------------------|
| editor.background | BACKGROUND |
| editor.foreground | FOREGROUND |
| editor.lineNumbers | LINE_NUMBERS_COLOR |
| editor.selection | SELECTION_BACKGROUND |
| editor.cursor | CARET_COLOR |

---

## Implementation Patterns (from existing exporters)

### Pattern 1: Load Overlay
```typescript
const overlay = await loadOverlay(overlayPath, platform);
```

### Pattern 2: Merge Manifest + Overlay
```typescript
const merged = mergeTokenOverrides(manifest, overlay);
```

### Pattern 3: Build Editor Colors
```typescript
function buildColors(manifest: Manifest, overlay: EditorOverlay) {
  return { ...manifest.colors, ...overlay.colors };
}
```

### Pattern 4: Transform to Platform Format
```typescript
const rules = merged.map(rule => ({
  scope: rule.scope,
  foreground: rule.settings.foreground,
  fontStyle: rule.settings.fontStyle
}));
```

### Pattern 5: Serialize
- Sublime: JSON serialization
- Vim: Custom scripting format
- Need: XML serialization for .icls

---

## Key Insights

1. **Two Overlay Files Possible:**
   - Single `jetbrains.json` for all JetBrains IDEs
   - Or separate `pycharm.json`, `webstorm.json` files (Phase 7)

2. **Scope Naming:**
   - JetBrains uses semantic token names (e.g., `KEYWORD`, `STRING`)
   - Themebooth uses scope paths (e.g., `keyword`, `string.literal`)
   - Need mapping layer

3. **Color Format:**
   - JetBrains: 6-digit hex without `#` (e.g., `569cd6`)
   - Themebooth: hex with `#` (e.g., `#569cd6`)
   - Conversion needed in serialization

4. **Font Styles:**
   - JetBrains: Numeric flags (1, 2, 4) in JSON value
   - Themebooth: String format (`bold`, `italic`)
   - Conversion needed

5. **XML Serialization:**
   - Need library or custom escaper for XML special chars
   - JSON values in attributes need proper escaping: `"` → `&quot;`

6. **Package Structure:**
   - `.jar` contains: `plugin.xml`, `theme/` folder, `META-INF/MANIFEST.MF`
   - Can use existing `archiver` library or JSZip for packaging

---

## References & Next Steps

- [JetBrains Plugin SDK](https://plugins.jetbrains.com/docs/intellij/)
- [Color Scheme Docs](https://plugins.jetbrains.com/docs/intellij/color-scheme-structure.html)
- [plugin.xml Schema](https://plugins.jetbrains.com/docs/intellij/plugin-configuration-file.html)

**Next Task (1.2):** Verify plugin.xml format above and prepare TypeScript interfaces for Task 2.2.

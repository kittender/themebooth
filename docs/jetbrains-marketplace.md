# JetBrains Marketplace Plugin Submission Guide

Submit your Themebooth-generated JetBrains theme plugin to the official JetBrains Marketplace.

## Prerequisites

1. ✓ Your theme is exported and tested locally
2. ✓ Package created with `themebooth export-intellij-package`
3. ✓ Converted to `.jar` file
4. ✓ JetBrains Marketplace account (free)
5. ✓ GitHub repository (recommended, for source code)

## Account Setup

### Create JetBrains Marketplace Account

1. Visit [plugins.jetbrains.com](https://plugins.jetbrains.com)
2. Click **Sign In** (top right)
3. Select **Create Account**
4. Use your email and create password
5. Verify email address
6. Complete profile: name, company, website

### Generate API Token

1. Log in to marketplace
2. Go to **Profile** (click your avatar)
3. Select **API Token** from menu
4. Click **Generate Token**
5. Save token securely (you'll need it)

## Package Preparation

### Create Plugin JAR

From your `export-intellij-package` output:

```bash
# Navigate to package directory
cd .themebooth/intellij-my-theme

# Create JAR file
zip -r ../intellij-my-theme.jar \
  plugin.xml \
  theme/ \
  META-INF/

# Verify JAR structure
unzip -l ../intellij-my-theme.jar
```

**Correct JAR structure:**
```
plugin.xml
theme/
├── MyTheme.icls
META-INF/
├── MANIFEST.MF
```

⚠️ **Important:** Don't nest files in a root folder. Files should be at JAR root.

### Verify plugin.xml

Check that `plugin.xml` contains:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<idea-plugin>
  <id>com.yourname.mytheme</id>
  <name>My Cool Theme</name>
  <version>1.0.0</version>
  <vendor email="your@email.com">Your Name</vendor>
  <description>A beautiful dark theme...</description>
  <idea-version since-build="211.0" />
  <extensions defaultExtensionNs="com.intellij">
    <themeProvider path="/theme/MyTheme.icls" />
  </extensions>
</idea-plugin>
```

## Plugin Information

Before submission, gather:

| Field | Example |
|-------|---------|
| **Plugin Name** | My Cool Theme |
| **Plugin ID** | `com.yourname.mytheme` |
| **Description** | A beautiful dark theme inspired by VS Code One Dark |
| **Category** | UI Themes |
| **Version** | 1.0.0 |
| **Change Notes** | Initial release |
| **Vendor Name** | Your Name |
| **Vendor Email** | your@email.com |
| **Repository URL** | https://github.com/user/my-theme |
| **License** | MIT / Apache 2.0 / etc. |

## Submission Steps

### Option A: Web Upload

1. Go to [plugins.jetbrains.com/plugin/submit](https://plugins.jetbrains.com/plugin/submit)
2. Click **Upload Plugin**
3. Select your `.jar` file
4. Fill in plugin details:
   - **Plugin Name**: "My Cool Theme"
   - **Category**: Select "UI Themes"
   - **Description**: Detailed description of theme
   - **Change Notes**: What changed in this version
   - **Vendor**: Your name/company
   - **Repository**: GitHub link
   - **License**: Select appropriate license
5. Accept terms and conditions
6. Click **Submit for Review**

### Option B: Command Line (using API Token)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -F "file=@intellij-my-theme.jar" \
  https://plugins.jetbrains.com/api/plugins/uploadPlugin
```

## What Happens Next

### Review Process

1. **Automated Checks** (1-2 minutes)
   - Plugin structure validation
   - .icls XML format verification
   - Icon and metadata checks

2. **Manual Review** (24-48 hours)
   - Team reviews theme for quality
   - Tests on multiple IDE versions
   - Checks for compatibility issues

3. **Approval/Feedback**
   - If approved: published immediately
   - If issues: you'll receive email with details
   - If rejected: explanation and resubmission guidelines

### During Review

- Your plugin gets a temporary URL
- You can test it before approval
- You'll receive status updates via email

## After Approval

### Plugin Published ✓

Your theme is now live on the marketplace:

1. Users can browse and install from IDE
2. Installation in IDE:
   - **Settings > Plugins > Marketplace**
   - Search your theme name
   - Click **Install** button
   - Restart IDE
   - Select theme from **Settings > Editor > Color Scheme**

### Marketing Your Theme

1. **Marketplace Page**
   - Add screenshots showing the theme in action
   - Update description with features
   - Add tags: `dark`, `blue`, `minimalist`, etc.

2. **Social Media**
   - Share on Twitter, Reddit, Dev.to
   - Use hashtag #JetBrains

3. **Documentation**
   - Link to your GitHub repository
   - Add installation instructions
   - Include customization guide

## Versioning and Updates

### Publishing Updates

When you update your theme:

1. Bump version in `manifest.json`: `1.0.0` → `1.0.1`
2. Update change notes: "Fixed color scheme for XML attributes"
3. Rebuild theme: `npm run build`
4. Export and package: `themebooth export-intellij-package`
5. Create new JAR
6. Submit same way as first release

JetBrains handles version management automatically.

### IDE Compatibility

Update `since-build` in your `plugin.xml` when dropping support for older IDEs:

```xml
<!-- Supports 2021.1 and later -->
<idea-version since-build="211.0" />

<!-- Supports 2022.3 and later -->
<idea-version since-build="223.0" />

<!-- Supports range (2021.1 to 2024.1) -->
<idea-version since-build="211.0" until-build="241.0" />
```

Current IDE versions:
- 2021.1 = build 211
- 2021.2 = build 212
- 2021.3 = build 213
- 2022.1 = build 221
- 2022.2 = build 222
- 2022.3 = build 223
- 2023.1 = build 231
- 2023.2 = build 232
- 2023.3 = build 233
- 2024.1 = build 241

## Troubleshooting Submission

### "Invalid plugin structure"

- Verify JAR has `plugin.xml` at root (not in folder)
- Verify `plugin.xml` is valid XML
- Check `theme/` folder exists with `.icls` file

### "Color scheme not found"

- Verify `plugin.xml` has correct `path="/theme/MyTheme.icls"`
- Verify `.icls` file is in `theme/` folder
- Check file name matches exactly

### "IDE version too restrictive"

- Change `since-build="211.0"` for broader compatibility
- Avoid `until-build` unless you have breaking changes

### "Plugin not installing"

- Verify IDE matches `since-build` version or newer
- Try **File > Invalidate Caches** in IDE
- Check IDE logs for error messages

### "Duplicate plugin ID"

- Use unique ID like `com.yourname.yourthemename`
- Check marketplace for existing plugins
- Add more specificity to ID

## Plugin Removal

If you want to remove your plugin from marketplace:

1. Log in to marketplace
2. Go to your plugin page
3. Click **Settings** (gear icon)
4. Select **Unpublish Plugin**
5. Confirm removal

**Note:** Existing installations won't be removed; users just won't get updates.

## Best Practices

### Theme Quality

- Test in multiple IDE versions (2021.1, 2022.3, 2024.1)
- Test with multiple file types (Python, JavaScript, XML, etc.)
- Verify contrast ratios for accessibility
- Include at least 2-3 color variants if possible

### Plugin Metadata

- Descriptive name that includes "Theme"
- Clear description of theme style/inspiration
- Screenshot showing theme in action
- Link to GitHub for transparency

### Updates

- Keep changelog updated
- Respond to user feedback
- Fix bugs in subsequent releases
- Add new color schemes over time

### Documentation

- Link to online documentation
- Include installation guide
- Explain customization options
- Add troubleshooting FAQ

## Resources

- **JetBrains Plugin SDK**: https://plugins.jetbrains.com/docs/intellij/
- **Color Scheme Reference**: https://plugins.jetbrains.com/docs/intellij/color-scheme-structure.html
- **Plugin Submission API**: https://plugins.jetbrains.com/docs/marketplace/api.html
- **Plugin Repository**: https://plugins.jetbrains.com
- **JetBrains Support Forum**: https://intellij-support.jetbrains.com/

## Support

If you encounter issues:

1. **Check Logs**: `~/.config/JetBrains/IntelliJIdea*/system/log/idea.log`
2. **Read Documentation**: https://plugins.jetbrains.com/docs/intellij/
3. **Contact Support**: submit-plugin@jetbrains.com
4. **Community Forum**: https://intellij-support.jetbrains.com/hc/community/topics

---

**Congratulations!** Your theme is now available to thousands of JetBrains IDE users worldwide. 🎉

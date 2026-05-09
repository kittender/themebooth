# Themebooth Integration Test Plan

This document outlines a comprehensive testing strategy to verify that Themebooth correctly generates syntax highlighting themes for all supported platforms (VS Code, Notepad++, Zed) and properly handles syntax highlighting for JavaScript, CSS, HTML, XML, Java, and Python.

## Overview

The integration test campaign validates:
- **Theme creation workflow** (init → edit → preview → package → export)
- **Manifest validation** (schema compliance, variable resolution, circular reference detection)
- **Computed colors** (darken, lighten, alpha transforms; chained transforms)
- **Theme inheritance** (extends field, deep merge, cycle detection, relative paths)
- **Cross-platform export** (VS Code JSON, Notepad++ XML, Zed JSON)
- **Syntax highlighting accuracy** (all supported languages and token types)
- **Semantic tokens** (language-aware highlighting, TextMate scope integration)
- **Language-specific tokens** (per-language token overrides)
- **Preset system** (preset definition, wizard creation, preset switching)
- **Live preview functionality** (hot-reload, code sample updates)
- **Color accuracy** (hex validation, variable interpolation, contrast ratios)

## Test Environment Setup

### Prerequisites

```bash
# Install Themebooth globally
npm install -g @kittender/themebooth

# Verify installation
themebooth --version
themebooth --help

# Create test directory
mkdir -p ~/themebooth-test-campaign
cd ~/themebooth-test-campaign
```

### Required Test Platforms

- **VS Code** (latest stable version)
- **Notepad++** (latest stable version, Windows or via Wine on macOS/Linux)
- **Zed** (latest stable version)
- **Node.js** (v14+) for theme generation
- **Browser** (Chrome/Firefox) for preview testing

---

## Phase 1: Foundation Testing

### Test 1.1: Theme Initialization

**Objective**: Verify that `themebooth init` creates valid project structure

**Steps**:
1. Create new theme project:
   ```bash
   themebooth init comprehensive-test
   cd comprehensive-test
   ```

2. Verify generated files:
   - `manifest.json` exists and is valid JSON
   - `.themebooth/` cache directory created
   - No syntax errors in generated files

3. Verify manifest structure:
   - Contains `name`, `author`, `description`, `version` fields
   - `variables`, `colors`, `tokens` objects present (even if empty/minimal)
   - `presets` array present

4. Check default values:
   - `version` matches semver format (e.g., "1.0.0")
   - `author` field is populated
   - `name` reflects the theme name provided

**Expected Result**: Project ready to edit, all files valid JSON, no missing fields.

---

### Test 1.2: Preset Loading

**Objective**: Verify preset templates are correctly applied

**Steps**:
1. Create theme with dark preset:
   ```bash
   themebooth init dark-test --preset dark
   cd dark-test
   cat manifest.json
   ```

2. Create theme with light preset:
   ```bash
   themebooth init light-test --preset light
   cd light-test
   cat manifest.json
   ```

3. Create theme with high-contrast preset:
   ```bash
   themebooth init hc-test --preset high-contrast
   cd hc-test
   cat manifest.json
   ```

4. Verify each preset:
   - Correct color palette loaded
   - All required fields populated
   - Variables properly defined
   - Token sets contain expected entries

**Expected Result**: Each preset loads correct color scheme; manifests are valid and complete.

---

### Test 1.3: Manifest Validation

**Objective**: Verify manifest parsing and validation via `themebooth validate` command

**Steps**:
1. Start with valid manifest (use preset as base)

2. Test required field validation using `themebooth validate`:
   - Remove `name` field → `themebooth validate` shows error
   - Remove `author` field → validation error
   - Remove `version` field → validation error
   - Remove `variables`, `colors`, `tokens` → should be optional/empty

3. Test version format validation:
   - Valid: "1.0.0", "2.1.3", "0.0.1"
   - Invalid: "1.0", "v1.0.0", "1.0.0.0" → `themebooth validate` shows errors

4. Test color format validation:
   - Valid: "#ffffff", "#fff", "#123abc", "#0d1117"
   - Invalid: "#gggggg", "#12345", "#12345678" → validation errors
   - Test auto-fix: `themebooth validate --fix` normalizes colors

5. Test variable naming:
   - Valid: `bg`, `fg`, `keyword_color`, `_accent`, `color123`
   - Invalid: `123invalid`, `color-name`, `color.name` → validation errors

6. Test CI output:
   - Run: `themebooth validate --ci`
   - Verify JSON output contains: `valid`, `errors`, `warnings`, `stats`

7. Test validation statistics:
   - `themebooth validate` shows counts: variables, colors, tokens, presets, computed

**Expected Result**: `themebooth validate` correctly enforces all validation rules with clear error messages and exit codes (0=valid, 1=errors, 2=warnings only).

---

## Phase 2: Variable and Color System Testing

### Test 2.1: Variable Definition and Resolution

**Objective**: Verify variable definitions, references, and transitive resolution

**Steps**:
1. Create manifest with variables:
   ```json
   {
     "name": "Test Theme",
     "author": "Test",
     "version": "1.0.0",
     "variables": {
       "primary_bg": "#0d1117",
       "primary_fg": "#c9d1d9",
       "accent": "$primary_fg"
     },
     "colors": {
       "editor.background": "$primary_bg",
       "editor.foreground": "$accent"
     },
     "tokens": {
       "keyword": {
         "foreground": "$accent"
       }
     }
   }
   ```

2. Run `themebooth preview` and verify:
   - Variables resolve correctly
   - Transitive references work (`$accent` → `$primary_fg` → `#c9d1d9`)
   - Colors appear correctly in preview

3. Test with circular reference (should fail):
   ```json
   "variables": {
     "a": "$b",
     "b": "$a"
   }
   ```
   Expected: Validation error on circular reference

4. Test undefined reference (should fail):
   ```json
   "colors": {
     "editor.background": "$undefined_color"
   }
   ```
   Expected: Validation error on undefined variable

**Expected Result**: Valid variables resolve correctly; circular/undefined references caught with clear errors.

---

### Test 2.2: Color System Integration

**Objective**: Verify color properties work across all editors

**Steps**:
1. Define comprehensive color set:
   ```json
   "colors": {
     "editor.background": "$bg",
     "editor.foreground": "$fg",
     "editor.lineNumberForeground": "$line_number",
     "editor.lineNumberActiveForeground": "$line_number_active",
     "editor.lineForeground": "$line_highlight",
     "editor.selectionBackground": "$selection",
     "editor.wordHighlightBackground": "$word_highlight",
     "editorCursor.foreground": "$cursor",
     "editorCursor.background": "$bg",
     "editorWhitespace.foreground": "$whitespace",
     "editorBracketMatch.background": "$bracket_match"
   }
   ```

2. Run preview and verify:
   - Background color correct
   - Text foreground readable
   - Line numbers visible and distinguishable
   - Selection highlighting works
   - Cursor visible and properly colored

3. Package theme and check each exporter output:
   - VS Code: `.vscode-theme.json` contains all color mappings
   - Notepad++: `.xml` contains RGB values in correct format
   - Zed: `.json` contains colors in Zed format

4. Test contrast ratios:
   - Foreground/background WCAG AA minimum (4.5:1)
   - Use online WCAG checker or color contrast analysis tool

**Expected Result**: All colors render correctly across all platforms; contrast ratios meet accessibility standards.

---

### Test 2.3: Computed Colors

**Objective**: Verify computed color transforms (darken, lighten, alpha) resolve correctly

**Steps**:
1. Create manifest with computed colors:
   ```json
   {
     "name": "Computed Test",
     "author": "Test",
     "version": "1.0.0",
     "variables": {
       "base_blue": "#0066ff",
       "base_red": "#ff0000"
     },
     "computed": {
       "blue_dark": {
         "base": "$base_blue",
         "transform": "darken",
         "amount": 20
       },
       "blue_light": {
         "base": "$base_blue",
         "transform": "lighten",
         "amount": 30
       },
       "red_faded": {
         "base": "$base_red",
         "transform": "alpha",
         "amount": 50
       }
     },
     "colors": {
       "editor.foreground": "$base_blue",
       "editor.selectionBackground": "$blue_dark",
       "editor.wordHighlightBackground": "$blue_light"
     }
   }
   ```

2. Run `themebooth preview` and verify:
   - Darken transform produces darker shade of base color
   - Lighten transform produces lighter shade of base color
   - Alpha transform produces semi-transparent color
   - All computed colors resolve in preview

3. Package theme and verify computed colors exported:
   - VS Code: final hex values present in `.vscode-theme.json`
   - Notepad++: RGB values computed and present in `.xml`
   - Zed: computed colors in `.json`

4. Test computed colors referencing other computed colors:
   ```json
   "computed": {
     "color1": { "base": "$base", "transform": "darken", "amount": 10 },
     "color2": { "base": "$color1", "transform": "darken", "amount": 10 }
   }
   ```
   Expected: Chained transforms applied correctly

5. Test error cases:
   - Invalid transform name → validation error
   - Amount < 0 or > 100 → validation error
   - Base references undefined variable → validation error

**Expected Result**: Computed colors correctly transform base colors; all transforms applied at build time; chaining works.

---

### Test 2.4: Theme Inheritance

**Objective**: Verify theme inheritance via `extends` field with proper merging

**Steps**:
1. Create base theme `base-theme.json`:
   ```json
   {
     "name": "Base Theme",
     "author": "Test Author",
     "version": "1.0.0",
     "description": "Base theme for testing",
     "variables": {
       "bg": "#1e1e1e",
       "fg": "#d4d4d4",
       "accent_blue": "#007acc",
       "accent_red": "#f48771"
     },
     "colors": {
       "editor.background": "$bg",
       "editor.foreground": "$fg",
       "editor.lineNumberForeground": "#858585"
     },
     "tokens": {
       "keyword": {
         "foreground": "$accent_blue",
         "fontStyle": "bold"
       },
       "comment": {
         "foreground": "#6a9955",
         "fontStyle": "italic"
       }
     }
   }
   ```

2. Create child theme `child-theme.json` in same directory:
   ```json
   {
     "extends": "./base-theme.json",
     "name": "Child Theme",
     "version": "1.1.0",
     "variables": {
       "accent_blue": "#0ea5e9"
     },
     "tokens": {
       "string": {
         "foreground": "#a371f7"
       }
     }
   }
   ```

3. Run `themebooth preview` on child theme and verify:
   - Child inherits all base variables except overrides
   - Child overrides: `accent_blue` has new value
   - Child adds: `string` token from base
   - Base `keyword` and `comment` tokens inherited
   - Final theme contains merged fields

4. Test relative path resolution:
   - Create subdirectory structure: `themes/base/manifest.json`, `themes/child/manifest.json`
   - Set `"extends": "../base/manifest.json"` in child
   - Verify relative path resolves correctly

5. Test deep merge behavior:
   - Base has 10 tokens, child adds 5 new tokens
   - Expected: Final has 15 tokens (10 + 5 new)
   - Test that objects are deep-merged, not replaced

6. Test cycle detection (should fail):
   - Create circular extends: A → B → A
   - Expected: Validation error on cycle detection

7. Package inherited theme and verify:
   - VS Code export shows all merged fields
   - Colors use resolved variables (not `$variable` syntax)
   - No `extends` field in exported manifests

**Expected Result**: Child manifests inherit parent correctly; deep merge works; cycles detected; exports are clean.

---

## Phase 3: Token System and Syntax Highlighting

### Test 3.1: JavaScript Syntax Highlighting

**Objective**: Verify complete JavaScript highlighting including ES6+

**Create test file** `test.js`:
```javascript
// Comment: this is a single-line comment
/* Multi-line
   comment with keywords */

const API_KEY = "secret_string";
const number = 42;
const hex = 0xDEADBEEF;
const float = 3.14;

class MyClass extends BaseClass {
  constructor(name, value = 100) {
    super();
    this.name = name;
    this.value = value;
  }

  async fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Fetch failed:", error);
    }
  }

  static staticMethod() {
    return MyClass.staticProperty;
  }

  get computed() {
    return this.value * 2;
  }
}

const arrow = (x, y) => x + y;
const spread = [...array, ...otherArray];
const destructured = { prop1, prop2: renamed } = obj;

function* generator() {
  yield 1;
  yield* otherGenerator();
}

const regex = /pattern\d+/gi;
const template = `String with ${variable} interpolation`;

export default MyClass;
import { named } from 'module';
```

**Test Steps**:
1. Create theme with JavaScript-appropriate tokens:
   - `keyword` (const, class, async, await, etc.)
   - `string` (both single/double quotes and template literals)
   - `comment` (single-line and block)
   - `number` (integers, floats, hex)
   - `constant.builtin` (true, false, null, undefined)
   - `function` (function names and method names)
   - `type` (class names)
   - `variable` (variable names)
   - `operator` (=, +, -, *, etc.)
   - `punctuation` (braces, brackets, parentheses)

2. Run preview with test file:
   ```bash
   themebooth preview
   ```
   Paste test.js into preview window

3. Verify highlighting:
   - Keywords properly colored and styled (bold recommended)
   - Strings distinct from other elements
   - Comments visible (italic recommended)
   - Numbers in distinct color
   - Class names and function names properly distinguished
   - Template literals properly highlighted
   - Regex patterns recognized
   - Arrow functions properly highlighted
   - Destructuring syntax highlighted

4. Export theme and test in actual VS Code:
   - Copy generated VS Code theme to: `~/.vscode/extensions/`
   - Create test workspace
   - Open test.js
   - Verify highlighting matches preview (allowing for VSCode's token scope differences)

**Expected Result**: All JavaScript syntax elements properly highlighted with appropriate colors and styles.

---

### Test 3.2: CSS/SCSS Syntax Highlighting

**Create test file** `test.css`:
```css
/* CSS Comment */
@import url('fonts.css');

:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --border-radius: 4px;
}

/* Selectors */
body,
html {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

#main-header {
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
  color: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button:hover::after {
  content: '→';
  animation: slideIn 0.3s ease-in-out;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .column {
    width: 100%;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**Test Steps**:
1. Add CSS tokens to manifest:
   - `property` (color, margin, padding, etc.)
   - `value` (property values)
   - `selector` (class, ID, element selectors)
   - `string` (font names, URLs in quotes)
   - `number` (sizes, percentages)
   - `unit` (px, em, rem, %)
   - `function` (rgb, rgba, linear-gradient)
   - `comment` (CSS comments)
   - `at-rule` (@media, @keyframes, @import)

2. Run preview and paste CSS test file

3. Verify:
   - Selectors properly colored (class, ID, element)
   - Properties and values distinguished
   - Strings (URLs, font names) clearly highlighted
   - At-rules visible and distinguishable
   - Comments properly styled
   - Numbers and units properly colored
   - Functions (gradient, rgba) recognized
   - Pseudo-classes/pseudo-elements (:hover, ::after) highlighted

**Expected Result**: CSS syntax properly highlighted across all elements.

---

### Test 3.3: HTML Syntax Highlighting

**Create test file** `test.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test Page</title>
  <link rel="stylesheet" href="styles.css" />
  <script src="script.js" defer></script>
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
  <header id="main-header" class="container">
    <h1>Welcome to Theme Test</h1>
    <nav>
      <a href="#about" data-toggle="modal">About</a>
    </nav>
  </header>

  <main role="main">
    <section class="featured">
      <article>
        <h2>Article Title</h2>
        <p>
          Paragraph with <strong>bold</strong>, <em>italic</em>,
          and <code>inline code</code>.
        </p>
        <blockquote cite="https://example.com">
          Quote with citation
        </blockquote>
      </article>

      <figure>
        <img src="image.jpg" alt="Description" />
        <figcaption>Image caption</figcaption>
      </figure>
    </section>

    <form action="/submit" method="POST" enctype="multipart/form-data">
      <fieldset>
        <legend>Form Fields</legend>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required />

        <label for="message">Message:</label>
        <textarea id="message" name="message" rows="5"></textarea>

        <button type="submit">Submit</button>
      </fieldset>
    </form>
  </main>

  <footer>
    <p>&copy; 2024 Test. All rights reserved.</p>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Page loaded');
    });
  </script>
</body>
</html>
```

**Test Steps**:
1. Add HTML tokens:
   - `tag` (HTML tags like div, span, etc.)
   - `tag.name` (tag names specifically)
   - `attribute` (attribute names)
   - `attribute.value` (attribute values)
   - `string` (quoted strings)
   - `entity` (HTML entities like &copy;)
   - `comment` (HTML comments)
   - `punctuation` (angle brackets, quotes)

2. Run preview with HTML test file

3. Verify:
   - Tag names properly colored
   - Attribute names distinguished from values
   - Quoted strings (URLs, alt text) highlighted
   - HTML entities recognized (like &copy;)
   - Comments properly styled
   - Opening/closing tags balanced and visible
   - Nested tags clearly distinguished
   - Embedded CSS and JavaScript sections properly highlighted

**Expected Result**: HTML structure and attributes clearly visible and distinguished.

---

### Test 3.4: XML/SVG Syntax Highlighting

**Create test file** `test.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- XML Document Configuration -->
<config xmlns="http://example.com/config" xmlns:app="http://app.example.com">
  <metadata>
    <name>Configuration</name>
    <version>1.0.0</version>
    <author email="admin@example.com">Administrator</author>
    <created timestamp="2024-01-15T10:30:00Z">2024-01-15</created>
  </metadata>

  <application>
    <settings>
      <setting key="debug" type="boolean">true</setting>
      <setting key="port" type="integer">8080</setting>
      <setting key="database">
        <connection>
          <host>localhost</host>
          <username>admin</username>
          <password encrypted="true">encrypted_value</password>
        </connection>
      </setting>
    </settings>

    <features>
      <feature enabled="true" version="1.0">
        <description>Feature description</description>
        <api endpoint="/api/v1/feature" method="GET" />
      </feature>
    </features>
  </application>

  <app:namespace>
    <app:element id="elem1" class="important">
      Content &amp; special chars
    </app:element>
  </app:namespace>
</config>
```

**Test Steps**:
1. Add XML tokens:
   - `tag` (XML element tags)
   - `attribute` (attribute names)
   - `string` (attribute values and text)
   - `comment` (XML comments)
   - `namespace` (XML namespaces)
   - `entity` (XML entities)
   - `cdata` (CDATA sections if supported)
   - `declaration` (XML declaration)

2. Run preview with XML test file

3. Verify:
   - Tag names properly colored
   - Namespace prefixes distinguished
   - Attribute names and values visually separated
   - Comments styled differently from content
   - Entities (like &amp;) recognized
   - Text content visible
   - Nested structure clear

4. Test with SVG variant:
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
     <circle cx="50" cy="50" r="40" fill="#007bff" />
     <rect x="10" y="10" width="80" height="80" stroke="#333" fill="none" />
     <text x="50" y="55" text-anchor="middle">SVG</text>
   </svg>
   ```

**Expected Result**: XML/SVG structure properly highlighted with namespaces and attributes visible.

---

### Test 3.5: Java Syntax Highlighting

**Create test file** `Test.java`:
```java
package com.example.themebooth;

import java.util.*;
import java.io.IOException;
import java.time.LocalDateTime;

/**
 * JavaDoc comment for class
 * @author Test Author
 * @version 1.0
 */
public class ThemeTest {
  private static final int MAX_SIZE = 100;
  private static final String API_KEY = "secret";
  public static final double PI = 3.14159;

  private String name;
  protected int value;
  boolean flag;

  public ThemeTest(String name) {
    this.name = name;
    this.value = 0;
  }

  @Override
  @Deprecated
  public String toString() {
    return String.format("ThemeTest{name='%s', value=%d}", name, value);
  }

  public static void main(String[] args) throws IOException {
    ThemeTest test = new ThemeTest("example");
    
    // Primitive types and literals
    byte b = 127;
    short s = 32767;
    int i = 2147483647;
    long l = 9223372036854775807L;
    float f = 3.14f;
    double d = 2.71828;
    char c = 'A';
    boolean bool = true;

    // String operations
    String str = "String literal";
    String template = String.format("Value: %d", i);
    String multiline = """
        Multi-line
        string literal
        """;

    // Collections
    List<String> list = new ArrayList<>();
    Map<String, Integer> map = new HashMap<>();
    Set<String> set = new HashSet<>();

    // Stream API
    list.stream()
        .filter(s -> s.length() > 0)
        .map(String::toUpperCase)
        .forEach(System.out::println);

    // Try-catch
    try {
      test.processData();
    } catch (IOException | NullPointerException e) {
      e.printStackTrace();
    } finally {
      System.out.println("Cleanup");
    }
  }

  public void processData() throws IOException {
    synchronized (this) {
      if (value > 0) {
        switch (value) {
          case 1 -> System.out.println("One");
          case 2 -> System.out.println("Two");
          default -> System.out.println("Other");
        }
      }
    }
  }

  private <T extends Comparable<T>> T findMax(T[] array) {
    T max = array[0];
    for (T item : array) {
      if (item.compareTo(max) > 0) {
        max = item;
      }
    }
    return max;
  }

  @FunctionalInterface
  interface Processor {
    void process(String input);
  }
}
```

**Test Steps**:
1. Add Java tokens:
   - `keyword` (public, private, class, interface, etc.)
   - `type` (built-in types: String, int, void, etc.)
   - `class` (class/interface names)
   - `method` (method names)
   - `variable` (variable names)
   - `number` (numeric literals with suffixes: L, f, etc.)
   - `string` (string literals, multiline strings)
   - `comment` (line comments, block comments, JavaDoc)
   - `annotation` (@Override, @Deprecated, etc.)
   - `operator` (arithmetic, logical operators)

2. Run preview with Java test file

3. Verify:
   - Keywords (public, class, interface) properly colored
   - Type names distinguished from variable names
   - Class names capitalized and highlighted
   - String literals clearly marked
   - Numbers with suffixes (100L, 3.14f) properly recognized
   - Comments including JavaDoc properly styled
   - Annotations (@Override) recognized
   - Generics syntax (<T>) properly highlighted
   - Lambda expressions (s -> ...) properly colored

**Expected Result**: Java syntax with all modern features (streams, lambdas, generics, records) properly highlighted.

---

### Test 3.6: Python Syntax Highlighting

**Create test file** `test.py`:
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module docstring explaining the module purpose.

This module demonstrates comprehensive Python syntax highlighting.
"""

import os
import sys
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import json

# Module-level constants
MAX_RETRIES = 3
API_ENDPOINT = "https://api.example.com"
CONFIG = {
    "debug": True,
    "timeout": 30,
    "headers": {"Content-Type": "application/json"}
}

class CustomException(Exception):
    """Custom exception for specific errors."""
    pass

@dataclass
class Person:
    """Dataclass representing a person."""
    name: str
    age: int
    email: str = "unknown@example.com"
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []

    def __repr__(self) -> str:
        return f"Person(name={self.name!r}, age={self.age}, email={self.email})"

    @property
    def is_adult(self) -> bool:
        """Check if person is adult."""
        return self.age >= 18

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        return "@" in email and "." in email.split("@")[-1]

    @classmethod
    def from_dict(cls, data: Dict[str, Union[str, int]]) -> "Person":
        """Create Person from dictionary."""
        return cls(**data)

def fetch_data(
    url: str,
    timeout: int = 10,
    retries: int = MAX_RETRIES
) -> Optional[Dict]:
    """
    Fetch data from API with retry logic.
    
    Args:
        url: API endpoint
        timeout: Request timeout in seconds
        retries: Number of retry attempts
        
    Returns:
        Response data or None if all retries failed
        
    Raises:
        CustomException: If all retries exhausted
    """
    attempt = 0
    while attempt < retries:
        try:
            # Simulated API call
            response = {
                "status": 200,
                "data": [1, 2, 3, 4, 5],
                "timestamp": datetime.now().isoformat()
            }
            return response
        except Exception as e:
            attempt += 1
            print(f"Attempt {attempt} failed: {e}")
            if attempt >= retries:
                raise CustomException(f"Failed after {retries} attempts")

def process_data(data: List[int]) -> Dict[str, Union[int, float]]:
    """Process numerical data."""
    if not data:
        return {"error": "Empty data"}
    
    result = {
        "count": len(data),
        "sum": sum(data),
        "mean": sum(data) / len(data),
        "min": min(data),
        "max": max(data)
    }
    return result

def main():
    """Main entry point."""
    # Literals and operations
    integer = 42
    floating = 3.14159
    string = "Hello, World!"
    multiline = """
    This is a multiline
    string with special chars: @#$%^&*()
    """
    
    # Containers
    my_list = [1, 2, 3, 4, 5]
    my_dict = {"key": "value", "nested": {"inner": True}}
    my_set = {1, 2, 3}
    my_tuple = (1, "two", 3.0)
    
    # Unpacking and f-strings
    a, b, *rest = my_list
    formatted = f"Values: {a=}, {b=}, rest={rest}"
    
    # Comprehensions
    squares = [x**2 for x in range(10)]
    filtered = {k: v for k, v in my_dict.items() if isinstance(v, str)}
    
    # Lambda and functional
    multiply = lambda x, y: x * y
    numbers = [1, 2, 3, 4, 5]
    squared = list(map(lambda x: x**2, numbers))
    
    # Control flow
    for i in range(5):
        if i % 2 == 0:
            print(f"Even: {i}")
        elif i == 3:
            print("Three")
        else:
            print(f"Odd: {i}")
    
    # Context manager
    try:
        person = Person.from_dict({"name": "Alice", "age": 30})
        print(person)
        
        if person.is_adult:
            print("Adult")
    except CustomException as e:
        print(f"Error: {e}")
    finally:
        print("Done")
    
    # Decorators
    @staticmethod
    def decorated():
        pass
    
    # Boolean operations
    result = True and False or None
    
    # Comments: single line
    pass  # inline comment

if __name__ == "__main__":
    main()
```

**Test Steps**:
1. Add Python tokens:
   - `keyword` (def, class, if, for, import, etc.)
   - `builtin` (len, range, map, filter, etc.)
   - `string` (single/double/triple quoted strings)
   - `number` (integers, floats, complex numbers)
   - `comment` (single-line and docstrings)
   - `function` (function definition names)
   - `class` (class names)
   - `decorator` (@staticmethod, @property, etc.)
   - `operator` (=, +, *, **, etc.)
   - `punctuation` (colons, brackets, etc.)
   - `variable` (variable names)
   - `type.hint` (type annotations)

2. Run preview with Python test file

3. Verify:
   - Keywords clearly distinguished
   - Docstrings properly formatted (triple quotes)
   - Type hints properly colored
   - Decorators (@) highlighted
   - Function definitions recognized
   - Class definitions recognized
   - String types (single/double/triple) distinguished
   - Numbers with operations (3.14, 1e-5) recognized
   - Comments clear
   - Indentation/structure visible

**Expected Result**: Python syntax with all modern features (type hints, dataclasses, walrus operator) properly highlighted.

---

### Test 3.7: Semantic Tokens

**Objective**: Verify semantic token styling works alongside TextMate scopes

**Steps**:
1. Create manifest with semantic tokens:
   ```json
   {
     "semanticTokens": {
       "variable": {
         "foreground": "#569cd6"
       },
       "variable.readonly": {
         "foreground": "#4ec9b0",
         "fontStyle": "bold"
       },
       "function": {
         "foreground": "#dcdcaa"
       },
       "function.builtin": {
         "foreground": "#ce9178",
         "fontStyle": "italic"
       },
       "type": {
         "foreground": "#4ec9b0"
       },
       "namespace": {
         "foreground": "#9cdcfe"
       }
     }
   }
   ```

2. Test with JavaScript file using semantic highlighting:
   ```javascript
   const PI = 3.14159;  // readonly variable
   let counter = 0;     // mutable variable
   function process(data) { }  // function
   const map = Array.map;      // builtin function
   class MyClass { }   // type
   namespace.subnamespace;  // namespace
   ```

3. Run preview and verify:
   - Semantic tokens override TextMate scopes where applicable
   - Readonly variables highlighted distinctly
   - Builtin functions properly styled
   - Type names use semantic styling

4. Package and verify semantic tokens exported:
   - VS Code: semanticTokenColors included (if supported)
   - Zed: semantic token mappings included

**Expected Result**: Semantic tokens style correctly; work alongside TextMate scopes without conflicts.

---

### Test 3.8: Language-Specific Tokens

**Objective**: Verify per-language token overrides work correctly

**Steps**:
1. Create manifest with language-specific tokens:
   ```json
   {
     "tokens": {
       "keyword": {
         "foreground": "#0066ff"
       }
     },
     "languageTokens": {
       "python": {
         "keyword": {
           "foreground": "#ffaa00"
         },
         "decorator": {
           "foreground": "#ff00ff"
         }
       },
       "javascript": {
         "keyword": {
           "foreground": "#ffdd00"
         }
       },
       "java": {
         "keyword": {
           "foreground": "#ff0000",
           "fontStyle": "bold"
         }
       }
     }
   }
   ```

2. Test with multi-language project:
   - Python file: keywords use `#ffaa00` (not `#0066ff`)
   - JavaScript file: keywords use `#ffdd00`
   - Java file: keywords use `#ff0000` bold
   - Other languages: use default `#0066ff`

3. Verify language detection:
   - File extension correctly identifies language
   - Each language token set applied independently

4. Test nested language tokens:
   - HTML file with embedded JavaScript
   - Expected: JS tokens within HTML use `languageTokens.javascript`

5. Package and verify:
   - VS Code: language-specific rules in tokenColors
   - Zed: per-language overrides included

**Expected Result**: Each language renders with correct language-specific tokens; defaults used for unlisted languages.

---

### Test 3.9: Preset Wizard CLI

**Objective**: Verify interactive preset creation via `themebooth preset add`

**Steps**:
1. Create theme with base variables:
   ```bash
   themebooth init preset-test
   cd preset-test
   ```

2. Run preset wizard:
   ```bash
   themebooth preset add
   ```

3. Test interactive prompts:
   - Wizard shows each variable with current value
   - User can skip or override each variable
   - Wizard validates hex colors and `$variable` references
   - Invalid input rejected with clear error
   - Wizard shows preview of preset

4. Create "dark" preset:
   - Override bg to darker shade
   - Override fg to lighter shade
   - Leave accent unchanged
   - Name preset "dark"

5. Create "high-contrast" preset:
   - Increase contrast of all colors
   - Add "High contrast for accessibility" description

6. Verify presets saved:
   ```bash
   cat manifest.json | grep -A 50 '"presets"'
   ```
   Expected: manifest contains preset definitions

7. Test preset with package:
   ```bash
   themebooth package
   ```
   Expected: Generated themes include preset support

8. Test preset switching in editor (if supported):
   - Install theme in target editor
   - Verify preset selector available
   - Switch between presets
   - Colors update correctly

**Expected Result**: Preset wizard creates valid presets; presets exported correctly; user can switch between presets in editors.

---

## Phase 4: Export and Multi-Platform Testing

### Test 4.1: VS Code Export

**Objective**: Verify VS Code theme generation and usability

**Steps**:
1. Package theme:
   ```bash
   themebooth package
   ```

2. Locate generated VS Code theme:
   - Check `dist/` or generated directory
   - Should create `.json` theme file

3. Verify JSON structure:
   - Contains `colors` object with editor colors
   - Contains `tokenColors` array with token rules
   - Valid JSON syntax

4. Install in VS Code:
   ```bash
   # Copy to VS Code extensions
   cp -r generated-theme ~/.vscode/extensions/
   # OR: copy theme file to VS Code themes directory
   ```

5. Test in VS Code:
   - Restart VS Code
   - Open theme in Settings → Color Theme
   - Select generated theme
   - Open test files (test.js, test.css, test.html, test.xml, test.java, test.py)
   - Verify each language renders correctly
   - Check editor UI colors (line numbers, selection, cursor)
   - Verify no rendering errors in console

6. Verify token scope mappings:
   - Different token scopes should use correct colors
   - Nested scopes handled properly (e.g., string.quoted.double)
   - Invalid/error highlighting visible

**Expected Result**: Theme installs and renders correctly in VS Code; all token scopes properly mapped.

---

### Test 4.2: Notepad++ Export

**Objective**: Verify Notepad++ XML theme generation

**Steps**:
1. Generate Notepad++ theme from package output

2. Verify XML structure:
   - Valid XML syntax
   - Contains style definitions
   - Colors converted to RGB (BGR format internally)
   - Font styles properly encoded

3. Install in Notepad++:
   ```
   Plugins → Theme Switcher → Open Themes Folder
   Place XML file in themes directory
   Restart Notepad++
   Plugins → Theme Switcher → select theme
   ```

4. Test each language:
   - Open test files in Notepad++
   - Verify colors match VS Code output
   - Check that font styles (bold, italic, underline) apply
   - Verify no XML parsing errors

5. Check specific features:
   - Keyword visibility
   - String highlighting
   - Comment distinction
   - Number recognition
   - Proper contrast

**Expected Result**: Notepad++ theme applies correctly; colors consistent with VS Code where applicable.

---

### Test 4.3: Zed Export

**Objective**: Verify Zed theme generation

**Steps**:
1. Generate Zed theme from package output

2. Verify JSON structure:
   - Valid Zed theme JSON format
   - Contains theme definition
   - Colors in Zed format

3. Install in Zed:
   - Copy theme file to Zed themes directory
   - Restart Zed
   - Settings → Appearance → Theme

4. Test rendering:
   - Open test files
   - Verify syntax highlighting
   - Check editor UI colors
   - Verify semantic tokens work

**Expected Result**: Zed theme renders correctly with proper syntax highlighting.

---

## Phase 5: Cross-Platform Validation

### Test 5.1: Color Consistency

**Objective**: Verify colors render consistently across platforms

**Steps**:
1. Take screenshots in each editor with same test file
2. Compare color values:
   - Extract exact RGB values from screenshots
   - VS Code, Notepad++, Zed should show same colors
   - Allow for minor rendering differences (antialiasing)

3. Use color picker in each editor:
   - Hover over colored token
   - Note color value
   - Compare across platforms

**Expected Result**: Colors consistent within ~5% RGB variance across platforms.

---

### Test 5.2: Syntax Coverage

**Objective**: Verify all tested languages highlight correctly on all platforms

**Test Matrix**:
```
Language    | VS Code | Notepad++ | Zed
JavaScript  |    ✓    |     ✓     |  ✓
CSS         |    ✓    |     ✓     |  ✓
HTML        |    ✓    |     ✓     |  ✓
XML         |    ✓    |     ✓     |  ✓
Java        |    ✓    |     ✓     |  ✓
Python      |    ✓    |     ✓     |  ✓
```

For each combination:
- [ ] Keywords highlighted
- [ ] Strings clearly marked
- [ ] Comments visible
- [ ] Numbers recognized
- [ ] Functions/classes distinguished
- [ ] Operators visible
- [ ] Structure clear

**Expected Result**: All language/platform combinations render correctly.

---

## Phase 6: Edge Cases and Stress Testing

### Test 6.1: Large File Performance

**Objective**: Verify theme handles large files without performance degradation

**Steps**:
1. Create large test file (10,000+ lines of code)
2. Open in each editor with theme applied
3. Measure performance:
   - Initial load time
   - Scroll responsiveness
   - Syntax highlighting lag
   - Memory usage

4. Expected metrics:
   - Initial load < 5 seconds
   - Smooth scrolling without stuttering
   - No freezing during editing

**Expected Result**: Theme handles large files efficiently.

---

### Test 6.2: Mixed Language Files

**Objective**: Verify embedded language highlighting

**Create test file** `mixed.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #fff; }
    .highlight { color: red; }
  </style>
  <script type="text/javascript">
    function init() {
      const config = {
        apiUrl: "https://api.example.com",
        timeout: 5000
      };
      console.log("Ready");
    }
  </script>
</head>
<body>
  <h1>Mixed Languages</h1>
  <p id="output"></p>
  <script>
    init();
  </script>
</body>
</html>
```

**Test Steps**:
1. Open in each editor
2. Verify:
   - HTML tags properly highlighted
   - Embedded CSS properly colored
   - Embedded JavaScript properly colored
   - Scopes properly switched between languages

**Expected Result**: Embedded languages correctly highlighted.

---

### Test 6.3: Special Characters and Unicode

**Objective**: Verify theme handles unicode and special characters

**Create test file** `unicode.txt`:
```
// Unicode identifiers (language-dependent)
const café = "coffee";
const π = 3.14;
const 你好 = "hello";

// Unicode in strings
const greeting = "Hello 世界 🌍";
const emoji = "👍 ✅ ⚠️ ❌";

// Special characters
const symbols = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~";
const escaped = "Line 1\nLine 2\t\tTabbed";
```

**Test Steps**:
1. Open in each editor
2. Verify:
   - Unicode characters render correctly
   - No display artifacts
   - Emoji display properly
   - Escaped characters highlighted
   - String boundaries clear

**Expected Result**: Unicode and special characters render correctly without artifacts.

---

## Phase 7: Live Preview Testing

### Test 7.1: Hot Reload Functionality

**Objective**: Verify live preview updates on manifest changes

**Steps**:
1. Start preview:
   ```bash
   themebooth preview
   ```

2. Open in browser, paste test.js

3. Make changes to manifest.json:
   - Change keyword color
   - Change background color
   - Modify string color

4. Observe browser:
   - Page should auto-reload or update
   - Changes visible immediately
   - No manual refresh needed

5. Make multiple rapid changes:
   - Verify all changes applied
   - No lost updates
   - Browser doesn't crash

**Expected Result**: Hot reload works smoothly; changes visible immediately.

---

### Test 7.2: Multiple Code Samples

**Objective**: Verify preview handles different code samples

**Steps**:
1. Start preview
2. Use dropdown or tabs to select built-in code samples:
   - JavaScript sample
   - CSS sample
   - HTML sample
   - etc.

3. Verify:
   - Each sample displays correctly
   - Theme applied to all samples
   - Switching between samples smooth

4. Paste custom code samples:
   - Various file types
   - Different sizes
   - Edge cases

**Expected Result**: Preview handles all code samples correctly.

---

## Phase 8: Validation and Quality Assurance

### Test 8.1: Manifest Completeness Checklist

```
Required Fields:
[ ] name (1-100 chars, alphanumeric + spaces/hyphens)
[ ] author (1-200 chars)
[ ] description (0-200 chars)
[ ] version (semver format)
[ ] variables (object or empty)
[ ] colors (object or empty)
[ ] tokens (object or empty)

Variables:
[ ] All variables have valid hex colors
[ ] All variable names follow naming rules
[ ] No circular dependencies
[ ] All referenced variables exist

Colors:
[ ] All color values valid hex
[ ] All variable references exist
[ ] Sufficient coverage for editor UI

Tokens:
[ ] Multiple token types covered
[ ] Color values valid hex or variable refs
[ ] fontStyle values valid (bold, italic, underline)
[ ] fontWeight values valid (100-900 or normal/bold)
[ ] opacity values 0.0-1.0 if present
```

**Expected Result**: Manifest passes all validation checks.

---

### Test 8.2: Visual Quality Assessment

**Steps**:
1. Evaluate colors:
   - [ ] Good contrast (WCAG AA minimum 4.5:1)
   - [ ] Complementary color scheme
   - [ ] No eye strain from bright colors
   - [ ] Professional appearance

2. Evaluate readability:
   - [ ] Keywords easily distinguished
   - [ ] Strings clearly marked
   - [ ] Comments visible but not distracting
   - [ ] Similar token types grouped by color
   - [ ] No visual confusion between token types

3. Evaluate consistency:
   - [ ] Related elements similar colors
   - [ ] Hierarchy clear (keywords > variables)
   - [ ] Same colors used consistently across platforms

**Expected Result**: Theme is visually appealing and readable.

---

## Phase 9: Regression Testing

After completing all tests, run regression suite:

1. **Theme Initialization**
   ```bash
   themebooth init regression-test-1
   themebooth init regression-test-2 --preset dark
   themebooth init regression-test-3 --preset light
   ```
   Verify all create without errors

2. **Preview Functionality**
   - Start preview for each theme
   - Load all test files
   - Verify hot-reload works
   - Close preview gracefully

3. **Export Process**
   ```bash
   themebooth package
   ```
   For each theme, verify all exports generated

4. **Cross-Platform Validation**
   - Install VS Code export, verify rendering
   - Install Notepad++ export (if available), verify rendering
   - Install Zed export (if available), verify rendering

---

## Test Reporting

### Test Results Template

```markdown
# Integration Test Results

Date: [Date]
Tester: [Name]
Theme Tested: [Theme Name]
Version: [Version]

## Summary
- Total Tests: [N]
- Passed: [N]
- Failed: [N]
- Skipped: [N]

## Phase Results
- [ ] Phase 1: Foundation - [Status]
- [ ] Phase 2: Variables - [Status]
- [ ] Phase 3: Syntax - [Status]
- [ ] Phase 4: Export - [Status]
- [ ] Phase 5: Validation - [Status]
- [ ] Phase 6: Edge Cases - [Status]
- [ ] Phase 7: Preview - [Status]
- [ ] Phase 8: QA - [Status]
- [ ] Phase 9: Regression - [Status]

## Issues Found
[List any failures or bugs]

## Notes
[Additional observations]
```

---

## Success Criteria

Integration testing is considered complete and successful when:

1. ✅ All manifest validation tests pass
2. ✅ All 6 languages highlight correctly in all 3 editors
3. ✅ Colors consistent across platforms (within 5% RGB variance)
4. ✅ Live preview hot-reload works smoothly
5. ✅ Exports generate valid files for all platforms
6. ✅ No console errors in any editor
7. ✅ Theme is visually appealing (subjective QA)
8. ✅ Performance acceptable on large files (< 5s load time)
9. ✅ All edge cases handled gracefully
10. ✅ Regression tests pass (no breaking changes)

---

## Troubleshooting

If tests fail, refer to TROUBLESHOOTING.md for solutions to:
- Validation errors
- Export failures
- Platform-specific rendering issues
- Performance problems
- Installation issues

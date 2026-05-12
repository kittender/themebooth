import { Manifest } from "../core/manifest";
import { resolveVariables, interpolateManifest } from "../core/variables";

interface ColorCategory {
  name: string;
  label: string;
  colors: Record<string, string>;
}

function categorizeColors(variables: Record<string, string>): ColorCategory[] {
  const categories: Record<string, Record<string, string>> = {
    appearance: {},
    base: {},
    advanced: {},
    css: {},
    python: {},
    html: {},
    javascript: {},
    other: {},
  };

  const categoryPatterns = {
    appearance: /^(bg|background|cursor|selection|fg|foreground|whitespace|error|warning|line|gutter)(_|$)/i,
    base: /^(comment|string|number|operator|keyword|constant|punctuation|tag|type)(_|$)/i,
    css: /^css_/i,
    python: /^python_/i,
    html: /^(html_|tag|entity_name_tag)/i,
    javascript: /^(js_|jsx_)/i,
  };

  for (const [name, color] of Object.entries(variables || {})) {
    let categorized = false;

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(name)) {
        categories[category][name] = color;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.advanced[name] = color;
    }
  }

  const result: ColorCategory[] = [];

  if (Object.keys(categories.appearance).length > 0) {
    result.push({
      name: "appearance",
      label: "Appearance",
      colors: categories.appearance,
    });
  }

  if (Object.keys(categories.base).length > 0) {
    result.push({
      name: "base",
      label: "Base",
      colors: categories.base,
    });
  }

  if (Object.keys(categories.css).length > 0) {
    result.push({
      name: "css",
      label: "CSS",
      colors: categories.css,
    });
  }

  if (Object.keys(categories.html).length > 0) {
    result.push({
      name: "html",
      label: "HTML",
      colors: categories.html,
    });
  }

  if (Object.keys(categories.javascript).length > 0) {
    result.push({
      name: "javascript",
      label: "JavaScript",
      colors: categories.javascript,
    });
  }

  if (Object.keys(categories.python).length > 0) {
    result.push({
      name: "python",
      label: "Python",
      colors: categories.python,
    });
  }

  if (Object.keys(categories.advanced).length > 0) {
    result.push({
      name: "advanced",
      label: "Advanced",
      colors: categories.advanced,
    });
  }

  if (Object.keys(categories.other).length > 0) {
    result.push({
      name: "other",
      label: "Other",
      colors: categories.other,
    });
  }

  return result;
}

function generateColorPalette(manifest: Manifest, resolved: Record<string, string>): string {
  const categories = categorizeColors(manifest.variables || {});
  let html = "";

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    html += `<h2>${category.label}</h2>`;
    html += `<div class="palette">`;

    for (const [name, color] of Object.entries(category.colors)) {
      const resolvedColor = resolved[name] || color;
      html += `
        <div class="color-box">
          <div class="swatch" style="background-color: ${resolvedColor};"></div>
          <div class="color-labels">
            <div class="name">${name}</div>
            <div class="value">${resolvedColor}</div>
          </div>
        </div>`;
    }

    html += `</div>`;

    if (i < categories.length - 1) {
      html += `<hr class="category-divider">`;
    }
  }

  return html;
}

function generateCSSFromTheme(manifest: Manifest): string {
  const keywordColor = manifest.tokens?.keyword?.foreground || "#569cd6";
  const stringColor = manifest.tokens?.string?.foreground || "#ce9178";
  const commentColor = manifest.tokens?.comment?.foreground || "#6a9955";
  const numberColor = manifest.tokens?.number?.foreground || "#b5cea8";
  const builtinColor = manifest.tokens?.["constant.builtin"]?.foreground || "#4ec9b0";
  const typeColor = manifest.tokens?.["entity.name.type"]?.foreground || "#4ec9b0";
  const methodColor = manifest.tokens?.["entity.name.function"]?.foreground || "#dcdcaa";
  const operatorColor = manifest.tokens?.operator?.foreground || "#d4d4d4";

  let css = ".keyword { color: " + keywordColor + "; font-weight: bold; }\n";
  css += ".string { color: " + stringColor + "; }\n";
  css += ".comment { color: " + commentColor + "; font-style: italic; }\n";
  css += ".number { color: " + numberColor + "; }\n";
  css += ".builtin { color: " + builtinColor + "; }\n";
  css += ".type { color: " + typeColor + "; }\n";
  css += ".method { color: " + methodColor + "; }\n";
  css += ".operator { color: " + operatorColor + "; }\n";

  return css;
}

export function renderPreview(manifest: Manifest, themeName: string): string {
  const variableResolution = resolveVariables(manifest);
  const resolved =
    variableResolution.success ? variableResolution.variables : {};

  const interpolated =
    variableResolution.success ?
      interpolateManifest(manifest, resolved)
      : manifest;

  const colorPalette = generateColorPalette(manifest, resolved);
  const themeCSS = generateCSSFromTheme(interpolated);
  const bgColor = interpolated.colors?.["editor.background"] || "#1e1e1e";
  const fgColor = interpolated.colors?.["editor.foreground"] || "#d4d4d4";
  const accentColor = interpolated.colors?.["editor.lineNumberActiveForeground"] || "#61dafb";
  const dimColor = interpolated.colors?.["editorWhitespace.foreground"] || "#888";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${themeName} - Live Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background-color: ${bgColor};
      color: ${fgColor};
      line-height: 1.6;
      margin: 0;
    }

    .wrapper {
      display: flex;
      gap: 0;
      height: 100vh;
      overflow: hidden;
    }

    .palette-panel {
      width: 40vw;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      padding: 20px;
      border-right: 1px solid #3e3e42;
    }

    .palette-panel h2 {
      font-size: 12px;
      color: ${accentColor};
      margin-top: 15px;
      margin-bottom: 8px;
      padding-bottom: 0;
      border-bottom: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .palette-panel h2:first-child {
      margin-top: 0;
    }

    .category-divider {
      border: none;
      border-top: 1px solid #3e3e42;
      margin: 12px 0;
      padding: 0;
    }

    .palette {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding-right: 5px;
      margin-bottom: 0;
    }

    .color-box {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 8px;
      flex: 1;
    }

    .color-box .swatch {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 3px;
      border: 1px solid #3e3e42;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .color-box .swatch:hover {
      border-color: ${accentColor};
      box-shadow: 0 0 8px rgba(97, 218, 251, 0.3);
    }

    .color-labels {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .color-box .name {
      font-size: 11px;
      color: #888;
      text-align: left;
      word-break: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .color-box .value {
      font-size: 10px;
      color: ${accentColor};
      font-family: monospace;
      text-align: left;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    h1 {
      margin-bottom: 10px;
      color: ${accentColor};
    }

    .subtitle {
      color: ${dimColor};
      margin-bottom: 20px;
    }

    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .controls label {
      color: ${dimColor};
      font-size: 14px;
    }

    .controls select {
      background-color: #252526;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      color: ${fgColor};
      padding: 8px 12px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      cursor: pointer;
    }

    .controls select:hover {
      border-color: ${accentColor};
    }

    .code-sample {
      background-color: #252526;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 15px;
      overflow-x: auto;
      display: none;
    }

    .code-sample.active {
      display: block;
    }

    .code-sample pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre;
      overflow-x: auto;
    }

    .code-sample code {
      font-size: 12px;
    }

    ${themeCSS}

    .status {
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .status.success {
      background-color: #1f6f1f;
      color: #6ec46e;
    }

    .status.error {
      background-color: #6f1f1f;
      color: #c46e6e;
    }

    .reload-hint {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #333;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 10px 15px;
      font-size: 12px;
      color: #888;
    }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: ${bgColor};
    }

    ::-webkit-scrollbar-thumb {
      background: #404040;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #505050;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="palette-panel" id="palette">
      ${colorPalette}
    </div>

    <div class="main-content">
      <h1>${themeName}</h1>
      <p class="subtitle">Live Preview • Edit manifest.json to see changes</p>

      <div id="status" class="status success" style="display:none;"></div>

      <div class="controls">
        <label for="language-select">Language:</label>
        <select id="language-select" onchange="switchLanguage(this.value)">
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="php">PHP</option>
          <option value="rust">Rust</option>
          <option value="golang">Go</option>
          <option value="csharp">C#</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="yaml">YAML</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div class="code-sample active" id="javascript">
        <pre><code>
<span class="comment">// Advanced JavaScript with multiple language primitives</span>
<span class="comment">// Demonstrates classes, interfaces, functions, async/await, destructuring, etc.</span>

<span class="keyword">interface</span> User {
  id: <span class="type">number</span>;
  name: <span class="type">string</span>;
  email: <span class="type">string</span>;
  role: <span class="type">'admin'</span> | <span class="type">'user'</span>;
}

<span class="keyword">class</span> <span class="type">UserManager</span> {
  <span class="keyword">private</span> users: User[] = [];
  <span class="keyword">private</span> <span class="keyword">readonly</span> maxUsers = <span class="number">100</span>;

  <span class="keyword">constructor</span>(<span class="keyword">private</span> apiUrl: <span class="type">string</span>) {}

  <span class="keyword">async</span> <span class="method">fetchUsers</span>(): <span class="type">Promise</span>&lt;User[]&gt; {
    <span class="keyword">try</span> {
      <span class="keyword">const</span> response = <span class="keyword">await</span> fetch(this.apiUrl);
      <span class="keyword">const</span> data = <span class="keyword">await</span> response.json();
      <span class="keyword">this</span>.users = data;
      <span class="keyword">return</span> this.users;
    } <span class="keyword">catch</span> (error) {
      console.error(<span class="string">'Failed to fetch users:'</span>, error);
      <span class="keyword">return</span> [];
    }
  }

  <span class="method">addUser</span>(user: User): <span class="type">boolean</span> {
    <span class="keyword">if</span> (<span class="keyword">this</span>.users.length &gt;= <span class="keyword">this</span>.maxUsers) {
      <span class="keyword">throw</span> <span class="keyword">new</span> Error(<span class="string">'User limit exceeded'</span>);
    }
    <span class="keyword">this</span>.users.push(user);
    <span class="keyword">return</span> <span class="keyword">true</span>;
  }

  <span class="method">removeUser</span>(id: <span class="type">number</span>): <span class="type">boolean</span> {
    <span class="keyword">const</span> index = <span class="keyword">this</span>.users.findIndex(u =&gt; u.id === id);
    <span class="keyword">if</span> (index &gt; <span class="operator">-</span><span class="number">1</span>) {
      <span class="keyword">this</span>.users.splice(index, <span class="number">1</span>);
      <span class="keyword">return</span> <span class="keyword">true</span>;
    }
    <span class="keyword">return</span> <span class="keyword">false</span>;
  }

  <span class="method">filterByRole</span>(role: <span class="type">string</span>): User[] {
    <span class="keyword">return</span> <span class="keyword">this</span>.users.filter(user =&gt; user.role === role);
  }

  <span class="method">mapToEmails</span>(): <span class="type">string</span>[] {
    <span class="keyword">return</span> <span class="keyword">this</span>.users.map(({ email }) =&gt; email);
  }

  <span class="method">getAdmins</span>(): User[] {
    <span class="keyword">const</span> { users } = <span class="keyword">this</span>;
    <span class="keyword">return</span> users.filter(u =&gt; u.role === <span class="string">'admin'</span>);
  }
}

<span class="comment">// Anonymous function with arrow syntax</span>
<span class="keyword">const</span> calculateSum = (arr: <span class="type">number</span>[]): <span class="type">number</span> =&gt; {
  <span class="keyword">return</span> arr.reduce((sum, val) =&gt; sum + val, <span class="number">0</span>);
};

<span class="comment">// Higher-order function</span>
<span class="keyword">const</span> memoize = &lt;T, U&gt;(fn: (arg: T) =&gt; U) =&gt; {
  <span class="keyword">const</span> cache = <span class="keyword">new</span> Map&lt;T, U&gt;();
  <span class="keyword">return</span> (arg: T): U =&gt; {
    <span class="keyword">if</span> (cache.has(arg)) {
      <span class="keyword">return</span> cache.get(arg)!;
    }
    <span class="keyword">const</span> result = fn(arg);
    cache.set(arg, result);
    <span class="keyword">return</span> result;
  };
};

<span class="comment">// Object destructuring with rest operator</span>
<span class="keyword">const</span> { name, email, ...rest } = <span class="keyword">this</span>.users[<span class="number">0</span>];

<span class="comment">// Array destructuring</span>
<span class="keyword">const</span> [first, second, ...others] = <span class="keyword">this</span>.users;

<span class="comment">// Async iterator pattern</span>
<span class="keyword">async</span> <span class="keyword">function</span>* <span class="method">asyncGenerator</span>() {
  <span class="keyword">for</span> (<span class="keyword">let</span> i = <span class="number">0</span>; i &lt; <span class="number">5</span>; i++) {
    <span class="keyword">await</span> <span class="keyword">new</span> Promise(r =&gt; setTimeout(r, <span class="number">1000</span>));
    <span class="keyword">yield</span> i;
  }
}

<span class="comment">// Usage example</span>
<span class="keyword">const</span> manager = <span class="keyword">new</span> UserManager(<span class="string">'https://api.example.com/users'</span>);
manager.fetchUsers();
<span class="keyword">const</span> admins = manager.getAdmins();
<span class="keyword">const</span> emails = manager.mapToEmails();
        </code></pre>
      </div>

      <div class="code-sample" id="python">
        <pre><code>
<span class="comment"># Advanced Python with classes, decorators, async, comprehensions</span>
<span class="comment"># Demonstrates various Python language features and patterns</span>

<span class="keyword">from</span> typing <span class="keyword">import</span> List, Dict, Optional, TypeVar, Generic
<span class="keyword">from</span> abc <span class="keyword">import</span> ABC, abstractmethod
<span class="keyword">import</span> asyncio
<span class="keyword">from</span> functools <span class="keyword">import</span> wraps

T = TypeVar(<span class="string">'T'</span>)

<span class="comment"># Abstract base class</span>
<span class="keyword">class</span> <span class="type">Repository</span>(ABC):
    <span class="keyword">@abstractmethod</span>
    <span class="keyword">async</span> <span class="keyword">def</span> <span class="method">fetch</span>(self):
        <span class="keyword">pass</span>

<span class="keyword">class</span> <span class="type">User</span>:
    <span class="keyword">def</span> <span class="method">__init__</span>(self, id: int, name: str, email: str):
        self.id = id
        self.name = name
        self.email = email

    <span class="keyword">def</span> <span class="method">__repr__</span>(self):
        <span class="keyword">return</span> <span class="string">f"User(id={self.id}, name={self.name})"</span>

<span class="keyword">class</span> <span class="type">UserManager</span>(Repository):
    <span class="keyword">def</span> <span class="method">__init__</span>(self, api_url: str):
        self.api_url = api_url
        self.users: List[User] = []

    <span class="keyword">async</span> <span class="keyword">def</span> <span class="method">fetch</span>(self) -&gt; List[User]:
        <span class="keyword">try</span>:
            <span class="comment"># Simulated async API call</span>
            <span class="keyword">await</span> asyncio.sleep(<span class="number">1</span>)
            <span class="keyword">return</span> self.users
        <span class="keyword">except</span> Exception <span class="keyword">as</span> e:
            print(<span class="string">f"Error fetching users: {e}"</span>)
            <span class="keyword">return</span> []

    <span class="keyword">def</span> <span class="method">add_user</span>(self, user: User) -&gt; bool:
        self.users.append(user)
        <span class="keyword">return</span> <span class="keyword">True</span>

    <span class="keyword">def</span> <span class="method">get_by_role</span>(self, role: str) -&gt; List[User]:
        <span class="keyword">return</span> [u <span class="keyword">for</span> u <span class="keyword">in</span> self.users <span class="keyword">if</span> hasattr(u, <span class="string">'role'</span>) <span class="keyword">and</span> u.role == role]

    <span class="keyword">def</span> <span class="method">get_emails</span>(self) -&gt; List[str]:
        <span class="keyword">return</span> [u.email <span class="keyword">for</span> u <span class="keyword">in</span> self.users]

    <span class="keyword">def</span> <span class="method">filter_by_name</span>(self, pattern: str) -&gt; List[User]:
        <span class="keyword">return</span> [u <span class="keyword">for</span> u <span class="keyword">in</span> self.users <span class="keyword">if</span> pattern <span class="keyword">in</span> u.name]

<span class="comment"># Decorator function</span>
<span class="keyword">def</span> <span class="method">timer</span>(func):
    <span class="keyword">@wraps</span>(func)
    <span class="keyword">def</span> <span class="method">wrapper</span>(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(<span class="string">f"{func.__name__} took {elapsed:.2f}s"</span>)
        <span class="keyword">return</span> result
    <span class="keyword">return</span> wrapper

<span class="comment"># Generator function</span>
<span class="keyword">def</span> <span class="method">count_up_to</span>(n: int):
    i = <span class="number">0</span>
    <span class="keyword">while</span> i &lt; n:
        <span class="keyword">yield</span> i
        i += <span class="number">1</span>

<span class="keyword">async</span> <span class="keyword">def</span> <span class="method">main</span>():
    manager = <span class="type">UserManager</span>(<span class="string">'https://api.example.com'</span>)
    users = <span class="keyword">await</span> manager.fetch()
    <span class="keyword">return</span> users

<span class="keyword">if</span> __name__ == <span class="string">'__main__'</span>:
    asyncio.run(main())
        </code></pre>
      </div>

      <div class="code-sample" id="java">
        <pre><code>
<span class="comment">// Advanced Java with interfaces, generics, lambdas, annotations</span>
<span class="comment">// Demonstrates comprehensive language features and patterns</span>

<span class="keyword">package</span> com.example.user;

<span class="keyword">import</span> java.util.*;
<span class="keyword">import</span> java.util.stream.*;
<span class="keyword">import</span> java.util.concurrent.*;

<span class="keyword">public</span> <span class="keyword">interface</span> <span class="type">Repository</span>&lt;T&gt; {
    Optional&lt;T&gt; findById(<span class="type">int</span> id);
    List&lt;T&gt; findAll();
    <span class="keyword">void</span> save(T entity);
    <span class="keyword">void</span> delete(T entity);
}

<span class="keyword">public</span> <span class="keyword">class</span> <span class="type">User</span> {
    <span class="keyword">private</span> <span class="keyword">final</span> <span class="type">int</span> id;
    <span class="keyword">private</span> <span class="keyword">final</span> <span class="type">String</span> name;
    <span class="keyword">private</span> <span class="keyword">final</span> <span class="type">String</span> email;
    <span class="keyword">private</span> <span class="type">UserRole</span> role;

    <span class="keyword">public</span> <span class="type">User</span>(<span class="type">int</span> id, <span class="type">String</span> name, <span class="type">String</span> email) {
        <span class="keyword">this</span>.id = id;
        <span class="keyword">this</span>.name = name;
        <span class="keyword">this</span>.email = email;
    }

    <span class="keyword">public</span> <span class="type">int</span> <span class="method">getId</span>() { <span class="keyword">return</span> id; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getName</span>() { <span class="keyword">return</span> name; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getEmail</span>() { <span class="keyword">return</span> email; }

    @Override
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">toString</span>() {
        <span class="keyword">return</span> <span class="string">String.format("User(id=%d, name=%s)"</span>, id, name);
    }
}

<span class="keyword">public</span> <span class="keyword">enum</span> <span class="type">UserRole</span> {
    ADMIN, USER, GUEST
}

<span class="keyword">public</span> <span class="keyword">class</span> <span class="type">UserManager</span> <span class="keyword">implements</span> <span class="type">Repository</span>&lt;<span class="type">User</span>&gt; {
    <span class="keyword">private</span> <span class="keyword">final</span> List&lt;<span class="type">User</span>&gt; users;
    <span class="keyword">private</span> <span class="keyword">final</span> <span class="type">String</span> apiUrl;
    <span class="keyword">private</span> <span class="keyword">static</span> <span class="keyword">final</span> <span class="type">int</span> MAX_USERS = <span class="number">100</span>;

    <span class="keyword">public</span> <span class="type">UserManager</span>(<span class="type">String</span> apiUrl) {
        <span class="keyword">this</span>.apiUrl = apiUrl;
        <span class="keyword">this</span>.users = <span class="keyword">new</span> CopyOnWriteArrayList&lt;&gt;();
    }

    @Override
    <span class="keyword">public</span> Optional&lt;<span class="type">User</span>&gt; <span class="method">findById</span>(<span class="type">int</span> id) {
        <span class="keyword">return</span> users.stream()
            .filter(u -&gt; u.getId() == id)
            .findFirst();
    }

    @Override
    <span class="keyword">public</span> List&lt;<span class="type">User</span>&gt; <span class="method">findAll</span>() {
        <span class="keyword">return</span> <span class="keyword">new</span> ArrayList&lt;&gt;(users);
    }

    @Override
    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">save</span>(<span class="type">User</span> user) {
        <span class="keyword">if</span> (users.size() &gt;= MAX_USERS) {
            <span class="keyword">throw</span> <span class="keyword">new</span> IllegalStateException(<span class="string">"User limit exceeded"</span>);
        }
        users.add(user);
    }

    @Override
    <span class="keyword">public</span> <span class="keyword">void</span> <span class="method">delete</span>(<span class="type">User</span> user) {
        users.remove(user);
    }

    <span class="keyword">public</span> List&lt;<span class="type">String</span>&gt; <span class="method">getEmails</span>() {
        <span class="keyword">return</span> users.stream()
            .map(<span class="type">User</span>::getEmail)
            .collect(Collectors.toList());
    }

    <span class="keyword">public</span> <span class="type">Map</span>&lt;<span class="type">Integer</span>, <span class="type">User</span>&gt; <span class="method">toMap</span>() {
        <span class="keyword">return</span> users.stream()
            .collect(Collectors.toMap(<span class="type">User</span>::getId, u -&gt; u));
    }

    <span class="keyword">public</span> &lt;T&gt; List&lt;T&gt; <span class="method">map</span>(<span class="type">Function</span>&lt;<span class="type">User</span>, T&gt; mapper) {
        <span class="keyword">return</span> users.stream()
            .map(mapper)
            .collect(Collectors.toList());
    }

    <span class="keyword">public</span> <span class="type">CompletableFuture</span>&lt;List&lt;<span class="type">User</span>&gt;&gt; <span class="method">fetchUsersAsync</span>() {
        <span class="keyword">return</span> <span class="type">CompletableFuture</span>.supplyAsync(() -&gt; {
            <span class="keyword">try</span> {
                <span class="type">Thread</span>.sleep(<span class="number">1000</span>);
                <span class="keyword">return</span> users;
            } <span class="keyword">catch</span> (<span class="type">InterruptedException</span> e) {
                <span class="type">Thread</span>.currentThread().interrupt();
                <span class="keyword">return</span> <span class="keyword">new</span> ArrayList&lt;&gt;();
            }
        });
    }
}
        </code></pre>
      </div>

      <div class="code-sample" id="php">
        <pre><code>
<span class="keyword">&lt;?php</span>

<span class="keyword">namespace</span> App\\User;

<span class="keyword">use</span> Exception;

<span class="comment">// Interface definition</span>
<span class="keyword">interface</span> <span class="type">RepositoryInterface</span> {
    <span class="keyword">public</span> <span class="keyword">function</span> findById(<span class="type">int</span> \$id);
    <span class="keyword">public</span> <span class="keyword">function</span> findAll(): <span class="type">array</span>;
    <span class="keyword">public</span> <span class="keyword">function</span> save(\$entity): <span class="type">bool</span>;
}

<span class="keyword">class</span> <span class="type">User</span> {
    <span class="keyword">private</span> <span class="type">int</span> \$id;
    <span class="keyword">private</span> <span class="type">string</span> \$name;
    <span class="keyword">private</span> <span class="type">string</span> \$email;

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">__construct</span>(<span class="type">int</span> \$id, <span class="type">string</span> \$name, <span class="type">string</span> \$email) {
        \$this-&gt;id = \$id;
        \$this-&gt;name = \$name;
        \$this-&gt;email = \$email;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">getId</span>(): <span class="type">int</span> {
        <span class="keyword">return</span> \$this-&gt;id;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">getName</span>(): <span class="type">string</span> {
        <span class="keyword">return</span> \$this-&gt;name;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">getEmail</span>(): <span class="type">string</span> {
        <span class="keyword">return</span> \$this-&gt;email;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">__toString</span>(): <span class="type">string</span> {
        <span class="keyword">return</span> <span class="string">"User(id={\$this-&gt;id}, name={\$this-&gt;name})"</span>;
    }
}

<span class="keyword">class</span> <span class="type">UserManager</span> <span class="keyword">implements</span> <span class="type">RepositoryInterface</span> {
    <span class="keyword">private</span> <span class="type">array</span> \$users = [];
    <span class="keyword">private</span> <span class="type">string</span> \$apiUrl;
    <span class="keyword">private</span> <span class="keyword">const</span> MAX_USERS = <span class="number">100</span>;

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">__construct</span>(<span class="type">string</span> \$apiUrl) {
        \$this-&gt;apiUrl = \$apiUrl;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">findById</span>(<span class="type">int</span> \$id) {
        <span class="keyword">foreach</span> (\$this-&gt;users <span class="keyword">as</span> \$user) {
            <span class="keyword">if</span> (\$user-&gt;getId() === \$id) {
                <span class="keyword">return</span> \$user;
            }
        }
        <span class="keyword">return</span> <span class="keyword">null</span>;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">findAll</span>(): <span class="type">array</span> {
        <span class="keyword">return</span> \$this-&gt;users;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">save</span>(\$user): <span class="type">bool</span> {
        <span class="keyword">if</span> (<span class="builtin">count</span>(\$this-&gt;users) &gt;= <span class="keyword">self</span>::MAX_USERS) {
            <span class="keyword">throw</span> <span class="keyword">new</span> Exception(<span class="string">'User limit exceeded'</span>);
        }
        \$this-&gt;users[] = \$user;
        <span class="keyword">return</span> <span class="keyword">true</span>;
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">getEmails</span>(): <span class="type">array</span> {
        <span class="keyword">return</span> <span class="builtin">array_map</span>(<span class="keyword">fn</span>(\$u) =&gt; \$u-&gt;getEmail(), \$this-&gt;users);
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">filter</span>(<span class="type">callable</span> \$predicate): <span class="type">array</span> {
        <span class="keyword">return</span> <span class="builtin">array_filter</span>(\$this-&gt;users, \$predicate);
    }

    <span class="keyword">public</span> <span class="keyword">function</span> <span class="method">map</span>(<span class="type">callable</span> \$fn): <span class="type">array</span> {
        <span class="keyword">return</span> <span class="builtin">array_map</span>(\$fn, \$this-&gt;users);
    }
}

<span class="keyword">?&gt;</span>
        </code></pre>
      </div>

      <div class="code-sample" id="rust">
        <pre><code>
<span class="comment">// Rust: Memory safety, ownership, pattern matching</span>
<span class="comment">// Demonstrates traits, iterators, error handling</span>

<span class="keyword">use</span> std::collections::HashMap;
<span class="keyword">use</span> std::error::Error;
<span class="keyword">use</span> std::fmt;

<span class="comment">// Custom error type</span>
<span class="keyword">enum</span> <span class="type">UserError</span> {
    NotFound(<span class="type">String</span>),
    InvalidEmail(<span class="type">String</span>),
    DatabaseError(<span class="type">String</span>),
}

<span class="keyword">impl</span> fmt::Display <span class="keyword">for</span> <span class="type">UserError</span> {
    <span class="keyword">fn</span> <span class="method">fmt</span>(&<span class="keyword">self</span>, f: &<span class="keyword">mut</span> fmt::Formatter) <span class="operator">-></span> fmt::Result {
        <span class="keyword">match</span> <span class="keyword">self</span> {
            <span class="type">UserError</span>::NotFound(msg) <span class="operator">=></span> write!(f, <span class="string">"User not found: {}"</span>, msg),
            <span class="type">UserError</span>::InvalidEmail(msg) <span class="operator">=></span> write!(f, <span class="string">"Invalid email: {}"</span>, msg),
            <span class="type">UserError</span>::DatabaseError(msg) <span class="operator">=></span> write!(f, <span class="string">"DB error: {}"</span>, msg),
        }
    }
}

<span class="keyword">impl</span> Error <span class="keyword">for</span> <span class="type">UserError</span> {}

<span class="comment">// Trait definition</span>
<span class="keyword">trait</span> <span class="type">Repository</span>&lt;T&gt; {
    <span class="keyword">fn</span> <span class="method">find_by_id</span>(&<span class="keyword">self</span>, id: <span class="type">u32</span>) <span class="operator">-></span> Result&lt;T, <span class="type">UserError</span>&gt;;
    <span class="keyword">fn</span> <span class="method">save</span>(&<span class="keyword">mut</span> <span class="keyword">self</span>, item: T) <span class="operator">-></span> Result&lt;(), <span class="type">UserError</span>&gt;;
}

<span class="keyword">struct</span> <span class="type">User</span> {
    id: <span class="type">u32</span>,
    name: <span class="type">String</span>,
    email: <span class="type">String</span>,
}

<span class="keyword">impl</span> <span class="type">User</span> {
    <span class="keyword">fn</span> <span class="method">new</span>(id: <span class="type">u32</span>, name: <span class="type">String</span>, email: <span class="type">String</span>) <span class="operator">-></span> Result&lt;<span class="type">Self</span>, <span class="type">UserError</span>&gt; {
        <span class="keyword">if</span> email.contains(<span class="string">'@'</span>) {
            Ok(<span class="type">User</span> { id, name, email })
        } <span class="keyword">else</span> {
            Err(<span class="type">UserError</span>::InvalidEmail(email))
        }
    }
}

<span class="keyword">struct</span> <span class="type">UserRepository</span> {
    users: HashMap&lt;<span class="type">u32</span>, <span class="type">User</span>&gt;,
}

<span class="keyword">impl</span> <span class="type">Repository</span>&lt;<span class="type">User</span>&gt; <span class="keyword">for</span> <span class="type">UserRepository</span> {
    <span class="keyword">fn</span> <span class="method">find_by_id</span>(&<span class="keyword">self</span>, id: <span class="type">u32</span>) <span class="operator">-></span> Result&lt;<span class="type">User</span>, <span class="type">UserError</span>&gt; {
        <span class="keyword">self</span>.users.get(&id)
            .cloned()
            .ok_or_else(|| <span class="type">UserError</span>::NotFound(id.to_string()))
    }

    <span class="keyword">fn</span> <span class="method">save</span>(&<span class="keyword">mut</span> <span class="keyword">self</span>, user: <span class="type">User</span>) <span class="operator">-></span> Result&lt;(), <span class="type">UserError</span>&gt; {
        <span class="keyword">self</span>.users.insert(user.id, user);
        Ok(())
    }
}

<span class="keyword">impl</span> <span class="type">UserRepository</span> {
    <span class="keyword">fn</span> <span class="method">find_admins</span>(&<span class="keyword">self</span>) <span class="operator">-></span> Vec&lt;&<span class="type">User</span>&gt; {
        <span class="keyword">self</span>.users
            .values()
            .filter(|u| u.name.contains(<span class="string">"admin"</span>))
            .collect()
    }

    <span class="keyword">fn</span> <span class="method">get_emails</span>(&<span class="keyword">self</span>) <span class="operator">-></span> Vec&lt;&<span class="type">String</span>&gt; {
        <span class="keyword">self</span>.users
            .values()
            .map(|u| &u.email)
            .collect()
    }
}

<span class="keyword">fn</span> <span class="method">main</span>() {
    <span class="keyword">let</span> <span class="keyword">mut</span> repo = <span class="type">UserRepository</span> { users: HashMap::new() };

    <span class="keyword">match</span> <span class="type">User</span>::new(<span class="number">1</span>, <span class="string">"Alice"</span>.to_string(), <span class="string">"alice@example.com"</span>.to_string()) {
        Ok(user) <span class="operator">=></span> {
            <span class="keyword">let</span> _ = repo.save(user);
        }
        Err(e) <span class="operator">=></span> eprintln!(<span class="string">"{}"</span>, e),
    }
}
        </code></pre>
      </div>

      <div class="code-sample" id="golang">
        <pre><code>
<span class="comment">// Go: Simplicity, concurrency, interfaces</span>
<span class="comment">// Demonstrates goroutines, channels, error handling</span>

<span class="keyword">package</span> main

<span class="keyword">import</span> (
    <span class="string">"encoding/json"</span>
    <span class="string">"fmt"</span>
    <span class="string">"sync"</span>
    <span class="string">"time"</span>
)

<span class="comment">// User represents a user record</span>
<span class="keyword">type</span> <span class="type">User</span> <span class="keyword">struct</span> {
    ID    <span class="type">int</span>    <span class="string">\`json:"id"\`</span>
    Name  <span class="type">string</span> <span class="string">\`json:"name"\`</span>
    Email <span class="type">string</span> <span class="string">\`json:"email"\`</span>
}

<span class="comment">// Repository defines user data operations</span>
<span class="keyword">type</span> <span class="type">Repository</span> <span class="keyword">interface</span> {
    FindByID(id <span class="type">int</span>) (*<span class="type">User</span>, <span class="type">error</span>)
    Save(user *<span class="type">User</span>) <span class="type">error</span>
    GetAll() []*<span class="type">User</span>
}

<span class="comment">// UserStore implements Repository</span>
<span class="keyword">type</span> <span class="type">UserStore</span> <span class="keyword">struct</span> {
    mu    <span class="type">sync</span>.<span class="type">RWMutex</span>
    users map[<span class="type">int</span>]*<span class="type">User</span>
}

<span class="keyword">func</span> (us *<span class="type">UserStore</span>) FindByID(id <span class="type">int</span>) (*<span class="type">User</span>, <span class="type">error</span>) {
    us.mu.RLock()
    <span class="keyword">defer</span> us.mu.RUnlock()

    user, ok := us.users[id]
    <span class="keyword">if</span> !ok {
        <span class="keyword">return</span> <span class="keyword">nil</span>, fmt.Errorf(<span class="string">"user not found: %d"</span>, id)
    }
    <span class="keyword">return</span> user, <span class="keyword">nil</span>
}

<span class="keyword">func</span> (us *<span class="type">UserStore</span>) Save(user *<span class="type">User</span>) <span class="type">error</span> {
    <span class="keyword">if</span> user == <span class="keyword">nil</span> {
        <span class="keyword">return</span> fmt.Errorf(<span class="string">"cannot save nil user"</span>)
    }
    us.mu.Lock()
    <span class="keyword">defer</span> us.mu.Unlock()
    us.users[user.ID] = user
    <span class="keyword">return</span> <span class="keyword">nil</span>
}

<span class="keyword">func</span> (us *<span class="type">UserStore</span>) GetAll() []*<span class="type">User</span> {
    us.mu.RLock()
    <span class="keyword">defer</span> us.mu.RUnlock()

    result := make([]*<span class="type">User</span>, <span class="number">0</span>, len(us.users))
    <span class="keyword">for</span> _, user := <span class="keyword">range</span> us.users {
        result = append(result, user)
    }
    <span class="keyword">return</span> result
}

<span class="comment">// ProcessUsers processes users concurrently</span>
<span class="keyword">func</span> ProcessUsers(store <span class="type">Repository</span>, ids []<span class="type">int</span>) &lt;-<span class="keyword">chan</span> <span class="type">string</span> {
    results := make(<span class="keyword">chan</span> <span class="type">string</span>, len(ids))

    <span class="keyword">go</span> <span class="keyword">func</span>() {
        <span class="keyword">defer</span> close(results)
        <span class="keyword">for</span> _, id := <span class="keyword">range</span> ids {
            user, err := store.FindByID(id)
            <span class="keyword">if</span> err != <span class="keyword">nil</span> {
                results &lt;- fmt.Sprintf(<span class="string">"Error: %v"</span>, err)
            } <span class="keyword">else</span> {
                results &lt;- fmt.Sprintf(<span class="string">"%s <%s>"</span>, user.Name, user.Email)
            }
        }
    }()

    <span class="keyword">return</span> results
}

<span class="keyword">func</span> main() {
    store := &<span class="type">UserStore</span>{users: make(map[<span class="type">int</span>]*<span class="type">User</span>)}

    users := []*<span class="type">User</span>{
        {ID: <span class="number">1</span>, Name: <span class="string">"Alice"</span>, Email: <span class="string">"alice@example.com"</span>},
        {ID: <span class="number">2</span>, Name: <span class="string">"Bob"</span>, Email: <span class="string">"bob@example.com"</span>},
    }

    <span class="keyword">for</span> _, user := <span class="keyword">range</span> users {
        store.Save(user)
    }

    <span class="keyword">for</span> result := <span class="keyword">range</span> ProcessUsers(store, []<span class="type">int</span>{<span class="number">1</span>, <span class="number">2</span>}) {
        fmt.Println(result)
    }
}
        </code></pre>
      </div>

      <div class="code-sample" id="csharp">
        <pre><code>
<span class="comment">// C#: Modern, async-first, LINQ</span>
<span class="comment">// Demonstrates async/await, properties, delegates</span>

<span class="keyword">using</span> System;
<span class="keyword">using</span> System.Collections.Generic;
<span class="keyword">using</span> System.Linq;
<span class="keyword">using</span> System.Threading.Tasks;

<span class="keyword">namespace</span> UserManagement
{
    <span class="keyword">public</span> <span class="keyword">class</span> <span class="type">User</span>
    {
        <span class="keyword">public</span> <span class="type">int</span> <span class="keyword">Id</span> { <span class="keyword">get</span>; <span class="keyword">set</span>; }
        <span class="keyword">public</span> <span class="type">string</span> <span class="keyword">Name</span> { <span class="keyword">get</span>; <span class="keyword">set</span>; }
        <span class="keyword">public</span> <span class="type">string</span> <span class="keyword">Email</span> { <span class="keyword">get</span>; <span class="keyword">set</span>; }
        <span class="keyword">public</span> <span class="type">UserRole</span> <span class="keyword">Role</span> { <span class="keyword">get</span>; <span class="keyword">set</span>; }

        <span class="keyword">public</span> <span class="type">User</span>(<span class="type">int</span> id, <span class="type">string</span> name, <span class="type">string</span> email)
        {
            <span class="keyword">Id</span> = id;
            <span class="keyword">Name</span> = name;
            <span class="keyword">Email</span> = email;
        }

        <span class="keyword">public</span> <span class="keyword">override</span> <span class="type">string</span> <span class="method">ToString</span>()
            <span class="operator">=></span> <span class="string">$"User(id={Id}, name={Name}, email={Email})"</span>;
    }

    <span class="keyword">public</span> <span class="keyword">enum</span> <span class="type">UserRole</span>
    {
        Admin,
        User,
        Guest
    }

    <span class="keyword">public</span> <span class="keyword">interface</span> <span class="type">IRepository</span>&lt;T&gt;
    {
        Task&lt;T&gt; <span class="method">FindByIdAsync</span>(<span class="type">int</span> id);
        Task&lt;<span class="type">bool</span>&gt; <span class="method">SaveAsync</span>(T item);
        Task&lt;IEnumerable&lt;T&gt;&gt; <span class="method">GetAllAsync</span>();
    }

    <span class="keyword">public</span> <span class="keyword">class</span> <span class="type">UserRepository</span> : <span class="type">IRepository</span>&lt;<span class="type">User</span>&gt;
    {
        <span class="keyword">private</span> <span class="keyword">readonly</span> Dictionary&lt;<span class="type">int</span>, <span class="type">User</span>&gt; _users = <span class="keyword">new</span>();

        <span class="keyword">public</span> <span class="keyword">async</span> Task&lt;<span class="type">User</span>&gt; <span class="method">FindByIdAsync</span>(<span class="type">int</span> id)
        {
            <span class="keyword">await</span> Task.Delay(<span class="number">100</span>);
            <span class="keyword">return</span> _users.TryGetValue(id, <span class="keyword">out</span> <span class="keyword">var</span> user)
                ? user
                : <span class="keyword">throw</span> <span class="keyword">new</span> KeyNotFoundException(<span class="string">$"User {id} not found"</span>);
        }

        <span class="keyword">public</span> <span class="keyword">async</span> Task&lt;<span class="type">bool</span>&gt; <span class="method">SaveAsync</span>(<span class="type">User</span> user)
        {
            <span class="keyword">await</span> Task.Delay(<span class="number">50</span>);
            _users[user.Id] = user;
            <span class="keyword">return</span> <span class="keyword">true</span>;
        }

        <span class="keyword">public</span> <span class="keyword">async</span> Task&lt;IEnumerable&lt;<span class="type">User</span>&gt;&gt; <span class="method">GetAllAsync</span>()
        {
            <span class="keyword">await</span> Task.Delay(<span class="number">50</span>);
            <span class="keyword">return</span> _users.Values;
        }

        <span class="keyword">public</span> <span class="keyword">async</span> Task&lt;IEnumerable&lt;<span class="type">string</span>&gt;&gt; <span class="method">GetEmailsAsync</span>()
        {
            <span class="keyword">var</span> users = <span class="keyword">await</span> <span class="method">GetAllAsync</span>();
            <span class="keyword">return</span> users
                .Where(u <span class="operator">=></span> u.Email.Contains(<span class="string">"@"</span>))
                .Select(u <span class="operator">=></span> u.Email)
                .OrderBy(e <span class="operator">=></span> e);
        }

        <span class="keyword">public</span> <span class="keyword">async</span> Task&lt;IEnumerable&lt;<span class="type">User</span>&gt;&gt; <span class="method">GetAdminsAsync</span>()
        {
            <span class="keyword">var</span> users = <span class="keyword">await</span> <span class="method">GetAllAsync</span>();
            <span class="keyword">return</span> users.Where(u <span class="operator">=></span> u.Role == <span class="type">UserRole</span>.Admin);
        }
    }

    <span class="keyword">public</span> <span class="keyword">class</span> <span class="type">Program</span>
    {
        <span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">async</span> Task <span class="method">Main</span>()
        {
            <span class="keyword">var</span> repo = <span class="keyword">new</span> <span class="type">UserRepository</span>();
            <span class="keyword">var</span> user = <span class="keyword">new</span> <span class="type">User</span>(<span class="number">1</span>, <span class="string">"Alice"</span>, <span class="string">"alice@example.com"</span>)
            {
                <span class="keyword">Role</span> = <span class="type">UserRole</span>.Admin
            };

            <span class="keyword">await</span> repo.SaveAsync(user);
            <span class="keyword">var</span> found = <span class="keyword">await</span> repo.FindByIdAsync(<span class="number">1</span>);
            Console.WriteLine(found);
        }
    }
}
        </code></pre>
      </div>

      <div class="code-sample" id="html">
        <pre><code>
<span class="comment">&lt;!-- HTML5: Semantic markup, accessibility, structure --&gt;</span>

<span class="keyword">&lt;!DOCTYPE html&gt;</span>
<span class="keyword">&lt;html</span> <span class="string">lang</span>=<span class="string">"en"</span><span class="keyword">&gt;</span>
<span class="keyword">&lt;head&gt;</span>
  <span class="keyword">&lt;meta</span> <span class="string">charset</span>=<span class="string">"UTF-8"</span><span class="keyword">&gt;</span>
  <span class="keyword">&lt;meta</span> <span class="string">name</span>=<span class="string">"viewport"</span> <span class="string">content</span>=<span class="string">"width=device-width, initial-scale=1.0"</span><span class="keyword">&gt;</span>
  <span class="keyword">&lt;title&gt;</span>User Management System<span class="keyword">&lt;/title&gt;</span>
  <span class="keyword">&lt;link</span> <span class="string">rel</span>=<span class="string">"stylesheet"</span> <span class="string">href</span>=<span class="string">"styles.css"</span><span class="keyword">&gt;</span>
<span class="keyword">&lt;/head&gt;</span>
<span class="keyword">&lt;body&gt;</span>
  <span class="keyword">&lt;header&gt;</span>
    <span class="keyword">&lt;nav&gt;</span>
      <span class="keyword">&lt;ul&gt;</span>
        <span class="keyword">&lt;li&gt;&lt;a</span> <span class="string">href</span>=<span class="string">"#home"</span><span class="keyword">&gt;</span>Home<span class="keyword">&lt;/a&gt;&lt;/li&gt;</span>
        <span class="keyword">&lt;li&gt;&lt;a</span> <span class="string">href</span>=<span class="string">"#users"</span><span class="keyword">&gt;</span>Users<span class="keyword">&lt;/a&gt;&lt;/li&gt;</span>
        <span class="keyword">&lt;li&gt;&lt;a</span> <span class="string">href</span>=<span class="string">"#contact"</span><span class="keyword">&gt;</span>Contact<span class="keyword">&lt;/a&gt;&lt;/li&gt;</span>
      <span class="keyword">&lt;/ul&gt;</span>
    <span class="keyword">&lt;/nav&gt;</span>
  <span class="keyword">&lt;/header&gt;</span>

  <span class="keyword">&lt;main&gt;</span>
    <span class="keyword">&lt;section</span> <span class="string">id</span>=<span class="string">"users"</span><span class="keyword">&gt;</span>
      <span class="keyword">&lt;h1&gt;</span>User Directory<span class="keyword">&lt;/h1&gt;</span>
      <span class="keyword">&lt;article</span> <span class="string">class</span>=<span class="string">"user-card"</span><span class="keyword">&gt;</span>
        <span class="keyword">&lt;img</span> <span class="string">src</span>=<span class="string">"avatar.jpg"</span> <span class="string">alt</span>=<span class="string">"User avatar"</span><span class="keyword">&gt;</span>
        <span class="keyword">&lt;h2&gt;</span>Alice Johnson<span class="keyword">&lt;/h2&gt;</span>
        <span class="keyword">&lt;p&gt;&lt;strong&gt;</span>Email:<span class="keyword">&lt;/strong&gt;</span> alice@example.com<span class="keyword">&lt;/p&gt;</span>
        <span class="keyword">&lt;p&gt;&lt;strong&gt;</span>Role:<span class="keyword">&lt;/strong&gt;</span> Administrator<span class="keyword">&lt;/p&gt;</span>
        <span class="keyword">&lt;button</span> <span class="string">type</span>=<span class="string">"button"</span><span class="keyword">&gt;</span>View Profile<span class="keyword">&lt;/button&gt;</span>
      <span class="keyword">&lt;/article&gt;</span>
    <span class="keyword">&lt;/section&gt;</span>

    <span class="keyword">&lt;section</span> <span class="string">id</span>=<span class="string">"form"</span><span class="keyword">&gt;</span>
      <span class="keyword">&lt;h2&gt;</span>Add New User<span class="keyword">&lt;/h2&gt;</span>
      <span class="keyword">&lt;form&gt;</span>
        <span class="keyword">&lt;fieldset&gt;</span>
          <span class="keyword">&lt;legend&gt;</span>User Information<span class="keyword">&lt;/legend&gt;</span>
          <span class="keyword">&lt;div&gt;</span>
            <span class="keyword">&lt;label</span> <span class="string">for</span>=<span class="string">"name"</span><span class="keyword">&gt;</span>Name:<span class="keyword">&lt;/label&gt;</span>
            <span class="keyword">&lt;input</span> <span class="string">type</span>=<span class="string">"text"</span> <span class="string">id</span>=<span class="string">"name"</span> <span class="string">name</span>=<span class="string">"name"</span> <span class="string">required</span><span class="keyword">&gt;</span>
          <span class="keyword">&lt;/div&gt;</span>
          <span class="keyword">&lt;div&gt;</span>
            <span class="keyword">&lt;label</span> <span class="string">for</span>=<span class="string">"email"</span><span class="keyword">&gt;</span>Email:<span class="keyword">&lt;/label&gt;</span>
            <span class="keyword">&lt;input</span> <span class="string">type</span>=<span class="string">"email"</span> <span class="string">id</span>=<span class="string">"email"</span> <span class="string">name</span>=<span class="string">"email"</span> <span class="string">required</span><span class="keyword">&gt;</span>
          <span class="keyword">&lt;/div&gt;</span>
          <span class="keyword">&lt;div&gt;</span>
            <span class="keyword">&lt;label</span> <span class="string">for</span>=<span class="string">"role"</span><span class="keyword">&gt;</span>Role:<span class="keyword">&lt;/label&gt;</span>
            <span class="keyword">&lt;select</span> <span class="string">id</span>=<span class="string">"role"</span> <span class="string">name</span>=<span class="string">"role"</span><span class="keyword">&gt;</span>
              <span class="keyword">&lt;option&gt;</span>User<span class="keyword">&lt;/option&gt;</span>
              <span class="keyword">&lt;option&gt;</span>Admin<span class="keyword">&lt;/option&gt;</span>
            <span class="keyword">&lt;/select&gt;</span>
          <span class="keyword">&lt;/div&gt;</span>
        <span class="keyword">&lt;/fieldset&gt;</span>
        <span class="keyword">&lt;button</span> <span class="string">type</span>=<span class="string">"submit"</span><span class="keyword">&gt;</span>Create User<span class="keyword">&lt;/button&gt;</span>
      <span class="keyword">&lt;/form&gt;</span>
    <span class="keyword">&lt;/section&gt;</span>
  <span class="keyword">&lt;/main&gt;</span>

  <span class="keyword">&lt;footer&gt;</span>
    <span class="keyword">&lt;p&gt;</span>&copy; <span class="number">2026</span> User Management System<span class="keyword">&lt;/p&gt;</span>
  <span class="keyword">&lt;/footer&gt;</span>
<span class="keyword">&lt;/body&gt;</span>
<span class="keyword">&lt;/html&gt;</span>
        </code></pre>
      </div>

      <div class="code-sample" id="css">
        <pre><code>
<span class="comment">/* CSS3: Flexbox, Grid, animations, media queries */</span>

<span class="keyword">:root</span> {
  <span class="operator">--primary-color</span>: <span class="string">#3498db</span>;
  <span class="operator">--secondary-color</span>: <span class="string">#2ecc71</span>;
  <span class="operator">--text-color</span>: <span class="string">#2c3e50</span>;
  <span class="operator">--border-radius</span>: <span class="number">8px</span>;
}

<span class="keyword">*</span> {
  <span class="operator">margin</span>: <span class="number">0</span>;
  <span class="operator">padding</span>: <span class="number">0</span>;
  <span class="operator">box-sizing</span>: <span class="builtin">border-box</span>;
}

<span class="keyword">body</span> {
  <span class="operator">font-family</span>: <span class="string">'Segoe UI'</span>, Tahoma, Geneva, Verdana, sans-serif;
  <span class="operator">background-color</span>: <span class="string">#ecf0f1</span>;
  <span class="operator">color</span>: <span class="keyword">var</span>(<span class="operator">--text-color</span>);
  <span class="operator">line-height</span>: <span class="number">1.6</span>;
}

<span class="keyword">header</span> {
  <span class="operator">background</span>: <span class="builtin">linear-gradient</span>(<span class="number">135deg</span>, <span class="keyword">var</span>(<span class="operator">--primary-color</span>), <span class="keyword">var</span>(<span class="operator">--secondary-color</span>));
  <span class="operator">color</span>: <span class="string">white</span>;
  <span class="operator">padding</span>: <span class="number">1rem</span>;
}

<span class="keyword">nav</span> <span class="keyword">ul</span> {
  <span class="operator">display</span>: <span class="builtin">flex</span>;
  <span class="operator">list-style</span>: <span class="builtin">none</span>;
  <span class="operator">gap</span>: <span class="number">2rem</span>;
}

<span class="keyword">nav</span> <span class="keyword">a</span> {
  <span class="operator">color</span>: <span class="string">white</span>;
  <span class="operator">text-decoration</span>: <span class="builtin">none</span>;
  <span class="operator">transition</span>: <span class="builtin">opacity</span> <span class="number">0.3s</span> <span class="builtin">ease</span>;
}

<span class="keyword">nav</span> <span class="keyword">a</span>:<span class="keyword">hover</span> {
  <span class="operator">opacity</span>: <span class="number">0.8</span>;
}

<span class="keyword">main</span> {
  <span class="operator">display</span>: <span class="builtin">grid</span>;
  <span class="operator">grid-template-columns</span>: <span class="builtin">repeat</span>(<span class="builtin">auto-fit</span>, <span class="builtin">minmax</span>(<span class="number">300px</span>, <span class="number">1fr</span>));
  <span class="operator">gap</span>: <span class="number">2rem</span>;
  <span class="operator">padding</span>: <span class="number">2rem</span>;
  <span class="operator">max-width</span>: <span class="number">1200px</span>;
  <span class="operator">margin</span>: <span class="number">0</span> <span class="builtin">auto</span>;
}

<span class="keyword">.user-card</span> {
  <span class="operator">background</span>: <span class="string">white</span>;
  <span class="operator">border-radius</span>: <span class="keyword">var</span>(<span class="operator">--border-radius</span>);
  <span class="operator">padding</span>: <span class="number">1.5rem</span>;
  <span class="operator">box-shadow</span>: <span class="number">0</span> <span class="number">2px</span> <span class="number">8px</span> rgba(<span class="number">0</span>, <span class="number">0</span>, <span class="number">0</span>, <span class="number">0.1</span>);
  <span class="operator">transition</span>: <span class="builtin">transform</span> <span class="number">0.3s</span>, <span class="builtin">box-shadow</span> <span class="number">0.3s</span>;
}

<span class="keyword">.user-card</span>:<span class="keyword">hover</span> {
  <span class="operator">transform</span>: <span class="builtin">translateY</span>(<span class="operator">-</span><span class="number">4px</span>);
  <span class="operator">box-shadow</span>: <span class="number">0</span> <span class="number">4px</span> <span class="number">16px</span> rgba(<span class="number">0</span>, <span class="number">0</span>, <span class="number">0</span>, <span class="number">0.2</span>);
}

<span class="keyword">button</span> {
  <span class="operator">background</span>: <span class="keyword">var</span>(<span class="operator">--primary-color</span>);
  <span class="operator">color</span>: <span class="string">white</span>;
  <span class="operator">border</span>: <span class="builtin">none</span>;
  <span class="operator">padding</span>: <span class="number">0.75rem</span> <span class="number">1.5rem</span>;
  <span class="operator">border-radius</span>: <span class="keyword">var</span>(<span class="operator">--border-radius</span>);
  <span class="operator">cursor</span>: <span class="builtin">pointer</span>;
  <span class="operator">transition</span>: <span class="builtin">background</span> <span class="number">0.3s</span>;
}

<span class="keyword">button</span>:<span class="keyword">hover</span> {
  <span class="operator">background</span>: <span class="builtin">darken</span>(<span class="keyword">var</span>(<span class="operator">--primary-color</span>), <span class="number">10%</span>);
}

<span class="keyword">@media</span> (<span class="operator">max-width</span>: <span class="number">768px</span>) {
  <span class="keyword">nav</span> <span class="keyword">ul</span> {
    <span class="operator">flex-direction</span>: <span class="builtin">column</span>;
    <span class="operator">gap</span>: <span class="number">1rem</span>;
  }

  <span class="keyword">main</span> {
    <span class="operator">grid-template-columns</span>: <span class="number">1fr</span>;
  }
}
        </code></pre>
      </div>

      <div class="code-sample" id="yaml">
        <pre><code>
<span class="comment"># YAML: Configuration, deployment, structured data</span>

<span class="keyword">version</span>: <span class="string">'3.8'</span>

<span class="keyword">services</span>:
  <span class="keyword">web</span>:
    <span class="keyword">image</span>: <span class="string">node:18-alpine</span>
    <span class="keyword">container_name</span>: <span class="string">app-web</span>
    <span class="keyword">ports</span>:
      <span class="operator">-</span> <span class="string">'3000:3000'</span>
    <span class="keyword">environment</span>:
      <span class="operator">-</span> <span class="string">NODE_ENV=production</span>
      <span class="operator">-</span> <span class="string">DEBUG=app:*</span>
    <span class="keyword">depends_on</span>:
      <span class="operator">-</span> <span class="string">database</span>
      <span class="operator">-</span> <span class="string">cache</span>
    <span class="keyword">volumes</span>:
      <span class="operator">-</span> <span class="string">'./src:/app/src'</span>
      <span class="operator">-</span> <span class="string">'/app/node_modules'</span>
    <span class="keyword">restart_policy</span>:
      <span class="keyword">condition</span>: <span class="string">on-failure</span>
      <span class="keyword">max_attempts</span>: <span class="number">3</span>
      <span class="keyword">delay</span>: <span class="number">5</span>s

  <span class="keyword">database</span>:
    <span class="keyword">image</span>: <span class="string">postgres:15-alpine</span>
    <span class="keyword">container_name</span>: <span class="string">app-db</span>
    <span class="keyword">environment</span>:
      <span class="keyword">POSTGRES_DB</span>: <span class="string">appdb</span>
      <span class="keyword">POSTGRES_USER</span>: <span class="string">postgres</span>
      <span class="keyword">POSTGRES_PASSWORD</span>: <span class="string">secure_password_123</span>
    <span class="keyword">ports</span>:
      <span class="operator">-</span> <span class="string">'5432:5432'</span>
    <span class="keyword">volumes</span>:
      <span class="operator">-</span> <span class="string">db_data:/var/lib/postgresql/data</span>
      <span class="operator">-</span> <span class="string">'./init.sql:/docker-entrypoint-initdb.d/init.sql'</span>
    <span class="keyword">healthcheck</span>:
      <span class="keyword">test</span>: [<span class="string">"CMD-SHELL"</span>, <span class="string">"pg_isready -U postgres"</span>]
      <span class="keyword">interval</span>: <span class="number">10</span>s
      <span class="keyword">timeout</span>: <span class="number">5</span>s
      <span class="keyword">retries</span>: <span class="number">5</span>

  <span class="keyword">cache</span>:
    <span class="keyword">image</span>: <span class="string">redis:7-alpine</span>
    <span class="keyword">container_name</span>: <span class="string">app-cache</span>
    <span class="keyword">ports</span>:
      <span class="operator">-</span> <span class="string">'6379:6379'</span>
    <span class="keyword">command</span>: <span class="string">redis-server --appendonly yes</span>
    <span class="keyword">volumes</span>:
      <span class="operator">-</span> <span class="string">cache_data:/data</span>

<span class="keyword">volumes</span>:
  <span class="keyword">db_data</span>:
  <span class="keyword">cache_data</span>:

<span class="keyword">networks</span>:
  <span class="keyword">default</span>:
    <span class="keyword">name</span>: <span class="string">app-network</span>
    <span class="keyword">driver</span>: <span class="string">bridge</span>
        </code></pre>
      </div>

      <div class="code-sample" id="json">
        <pre><code>
{
  <span class="string">"theme"</span>: {
    <span class="string">"name"</span>: <span class="string">"${themeName}"</span>,
    <span class="string">"version"</span>: <span class="string">"2.0.0"</span>,
    <span class="string">"description"</span>: <span class="string">"Color theme"</span>,
    <span class="string">"author"</span>: <span class="string">"Theme Creator"</span>
  },
  <span class="string">"colors"</span>: {
    <span class="string">"primary"</span>: {
      <span class="string">"background"</span>: <span class="string">"${interpolated.colors?.["editor.background"] || "#1e1e1e"}"</span>,
      <span class="string">"foreground"</span>: <span class="string">"${interpolated.colors?.["editor.foreground"] || "#d4d4d4"}"</span>,
      <span class="string">"accent"</span>: <span class="string">"${accentColor}"</span>
    }
  }
}
        </code></pre>
      </div>
    </div>
  </div>

  <div class="reload-hint">🔄 Watching for changes...</div>

  <script>
    function switchLanguage(language) {
      document.querySelectorAll('.code-sample').forEach(sample => {
        sample.classList.remove('active');
      });

      const selected = document.getElementById(language);
      if (selected) {
        selected.classList.add('active');
      }
    }

    const ws = new WebSocket(\`ws://\${window.location.host}/ws\`);
    ws.addEventListener('message', (event) => {
      if (event.data === 'reload') {
        window.location.reload();
      }
    });
    ws.addEventListener('error', () => {
      console.log('WebSocket connection failed - hot-reload unavailable');
    });
  </script>
</body>
</html>`;
}

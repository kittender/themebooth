import { Manifest } from "../core/manifest";
import { resolveVariables, interpolateManifest } from "../core/variables";

function generateColorPalette(manifest: Manifest, resolved: Record<string, string>): string {
  let html = "";

  for (const [name, color] of Object.entries(manifest.variables || {})) {
    const resolvedColor = resolved[name] || color;
    html += `
      <div class="color-box">
        <div class="swatch" style="background-color: ${resolvedColor};"></div>
        <div class="name">${name}</div>
        <div class="value">${resolvedColor}</div>
      </div>`;
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
      padding: 20px;
      line-height: 1.6;
    }

    .wrapper {
      display: flex;
      gap: 20px;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
    }

    .palette-panel {
      width: 180px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .palette-panel h2 {
      font-size: 14px;
      color: ${accentColor};
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
    }

    .palette {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding-right: 5px;
    }

    .color-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex: 0 1 calc(50% - 4px);
      min-width: 70px;
    }

    .color-box .swatch {
      width: 48px;
      height: 48px;
      border-radius: 3px;
      border: 1px solid #3e3e42;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .color-box .swatch:hover {
      border-color: ${accentColor};
      box-shadow: 0 0 8px rgba(97, 218, 251, 0.3);
    }

    .color-box .name {
      font-size: 9px;
      color: #888;
      text-align: center;
      word-break: break-word;
      max-width: 50px;
    }

    .color-box .value {
      font-size: 8px;
      color: ${accentColor};
      font-family: monospace;
      display: none;
    }

    .color-box:hover .value {
      display: block;
    }

    .main-content {
      flex: 1;
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
      max-height: 600px;
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
    <div class="palette-panel">
      <h2>Palette</h2>
      <div class="palette" id="palette">${colorPalette}</div>
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

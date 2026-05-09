import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { deepMergeManifests, resolveInheritance } from "../inheritance";

describe("deepMergeManifests", () => {
  it("merges simple scalar values with child winning", () => {
    const parent = { name: "parent", version: "1.0.0" };
    const child = { name: "child" };
    const result = deepMergeManifests(parent, child);
    expect(result.name).toBe("child");
    expect(result.version).toBe("1.0.0");
  });

  it("merges nested objects recursively", () => {
    const parent = { variables: { a: "#111", b: "#222" } };
    const child = { variables: { b: "#333", c: "#444" } };
    const result = deepMergeManifests(parent, child);
    expect(result.variables).toEqual({ a: "#111", b: "#333", c: "#444" });
  });

  it("child array replaces parent array", () => {
    const parent = { items: [1, 2, 3] };
    const child = { items: [4, 5] };
    const result = deepMergeManifests(parent, child);
    expect(result.items).toEqual([4, 5]);
  });

  it("strips extends key from result", () => {
    const parent = { name: "parent" };
    const child = { extends: "../parent.json", name: "child" };
    const result = deepMergeManifests(parent, child);
    expect(result.extends).toBeUndefined();
    expect(result.name).toBe("child");
  });

  it("handles deeply nested merge", () => {
    const parent = { tokens: { comment: { foreground: "#888" } } };
    const child = { tokens: { comment: { fontStyle: "italic" } } };
    const result = deepMergeManifests(parent, child);
    expect(result.tokens).toEqual({
      comment: { foreground: "#888", fontStyle: "italic" },
    });
  });
});

describe("resolveInheritance", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "themebooth-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it("loads a manifest with no extends", async () => {
    const manifestPath = path.join(tempDir, "manifest.json");
    const manifestData = { name: "test", variables: { a: "#111" } };
    await fs.writeFile(manifestPath, JSON.stringify(manifestData));

    const result = await resolveInheritance(manifestPath);
    expect(result.name).toBe("test");
    expect(result.variables).toEqual({ a: "#111" });
  });

  it("merges a single parent into child", async () => {
    const parentPath = path.join(tempDir, "parent.json");
    const childPath = path.join(tempDir, "child.json");

    const parentData = { name: "parent", variables: { a: "#111" } };
    const childData = { extends: "./parent.json", variables: { b: "#222" } };

    await fs.writeFile(parentPath, JSON.stringify(parentData));
    await fs.writeFile(childPath, JSON.stringify(childData));

    const result = await resolveInheritance(childPath);
    expect(result.variables).toEqual({ a: "#111", b: "#222" });
    expect(result.extends).toBeUndefined();
  });

  it("handles two-level inheritance chain", async () => {
    const grandparentPath = path.join(tempDir, "grandparent.json");
    const parentPath = path.join(tempDir, "parent.json");
    const childPath = path.join(tempDir, "child.json");

    await fs.writeFile(grandparentPath, JSON.stringify({ variables: { a: "#111" } }));
    await fs.writeFile(
      parentPath,
      JSON.stringify({ extends: "./grandparent.json", variables: { b: "#222" } })
    );
    await fs.writeFile(
      childPath,
      JSON.stringify({ extends: "./parent.json", variables: { c: "#333" } })
    );

    const result = await resolveInheritance(childPath);
    expect(result.variables).toEqual({ a: "#111", b: "#222", c: "#333" });
  });

  it("detects circular inheritance", async () => {
    const aPath = path.join(tempDir, "a.json");
    const bPath = path.join(tempDir, "b.json");

    await fs.writeFile(aPath, JSON.stringify({ extends: "./b.json" }));
    await fs.writeFile(bPath, JSON.stringify({ extends: "./a.json" }));

    await expect(resolveInheritance(aPath)).rejects.toThrow(/Circular inheritance/);
  });

  it("throws for non-existent parent file", async () => {
    const childPath = path.join(tempDir, "child.json");
    await fs.writeFile(childPath, JSON.stringify({ extends: "./missing.json" }));

    await expect(resolveInheritance(childPath)).rejects.toThrow(/Failed to load manifest|not found/);
  });

  it("resolves extends path relative to manifest directory", async () => {
    const subDir = path.join(tempDir, "subdir");
    await fs.mkdir(subDir, { recursive: true });

    const parentPath = path.join(tempDir, "parent.json");
    const childPath = path.join(subDir, "child.json");

    await fs.writeFile(parentPath, JSON.stringify({ variables: { a: "#111" } }));
    await fs.writeFile(
      childPath,
      JSON.stringify({ extends: "../parent.json", variables: { b: "#222" } })
    );

    const result = await resolveInheritance(childPath);
    expect(result.variables).toEqual({ a: "#111", b: "#222" });
  });
});

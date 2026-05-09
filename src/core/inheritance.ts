import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";

export function deepMergeManifests(
  parent: Record<string, unknown>,
  child: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...parent };

  for (const [key, childValue] of Object.entries(child)) {
    // Strip `extends` from output (it's a build-time directive)
    if (key === "extends") {
      continue;
    }

    const parentValue = result[key];

    // Both are plain objects (not arrays or null) → recurse
    if (
      typeof parentValue === "object" &&
      parentValue !== null &&
      !Array.isArray(parentValue) &&
      typeof childValue === "object" &&
      childValue !== null &&
      !Array.isArray(childValue)
    ) {
      result[key] = deepMergeManifests(
        parentValue as Record<string, unknown>,
        childValue as Record<string, unknown>
      );
    } else {
      // Child wins: scalar, array, or type mismatch
      result[key] = childValue;
    }
  }

  return result;
}

async function loadRawManifest(filePath: string): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Manifest file not found: ${filePath}`);
    }
    throw new Error(`Failed to load manifest from ${filePath}: ${String(error)}`);
  }
}

export async function resolveInheritance(
  manifestPath: string,
  seen?: Set<string>
): Promise<Record<string, unknown>> {
  if (!seen) {
    seen = new Set();
  }

  const resolvedPath = path.resolve(manifestPath);

  if (seen.has(resolvedPath)) {
    throw new Error(`Circular inheritance detected: ${[...seen].join(" → ")} → ${resolvedPath}`);
  }

  seen.add(resolvedPath);
  const manifestData = await loadRawManifest(resolvedPath);

  // If no extends, return as-is
  if (!manifestData.extends || typeof manifestData.extends !== "string") {
    return manifestData;
  }

  // Resolve parent path relative to this manifest's directory
  const parentPath = path.resolve(path.dirname(resolvedPath), manifestData.extends);

  // Recursively load parent chain
  const parentData = await resolveInheritance(parentPath, new Set(seen));

  // Merge: parent first, then apply this manifest on top
  return deepMergeManifests(parentData, manifestData);
}

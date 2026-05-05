import * as fs from "fs/promises";
import * as path from "path";

let cachedSchema: Record<string, unknown> | undefined;

async function loadSchema(): Promise<Record<string, unknown>> {
  if (cachedSchema) {
    return cachedSchema;
  }

  const schemaPath = path.join(__dirname, "../templates/manifest.schema.json");
  const content = await fs.readFile(schemaPath, "utf-8");
  cachedSchema = JSON.parse(content) as Record<string, unknown>;
  return cachedSchema;
}

/**
 * Returns schema reference for manifest.json ($schema field)
 */
export function getSchemaRef(): string {
  return "https://themebooth.dev/schema/manifest.json";
}

/**
 * Creates manifest with schema reference for IDE support
 */
export function addSchemaToManifest(manifest: Record<string, unknown>): Record<string, unknown> {
  return {
    $schema: getSchemaRef(),
    ...manifest,
  };
}

/**
 * Loads the full JSON schema (for validation or reference)
 */
export async function getFullSchema(): Promise<Record<string, unknown>> {
  return loadSchema();
}

/**
 * Formats manifest for output with schema reference
 */
export function formatManifestForOutput(manifest: Record<string, unknown>): string {
  const withSchema = addSchemaToManifest(manifest);
  return JSON.stringify(withSchema, null, 2);
}

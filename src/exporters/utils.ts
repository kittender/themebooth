import { Manifest } from "../core/manifest";
import { EditorOverlay } from "../core/overlay";
import { extractTokenSettings } from "../core/schemas";

export interface TokenRule {
  scope: string;
  settings: Record<string, any>;
}

export function mergeTokenOverrides(
  manifest: Manifest,
  overlay: EditorOverlay | null
): TokenRule[] {
  const rules: TokenRule[] = [];

  // Add tokens from manifest
  for (const [scope, settings] of Object.entries(manifest.tokens || {})) {
    const extracted = extractTokenSettings(settings);
    if (Object.keys(extracted).length > 0) {
      rules.push({
        scope,
        settings: extracted,
      });
    }
  }

  // Apply overrides from overlay
  if (overlay?.tokenOverrides) {
    for (const [scope, overrides] of Object.entries(overlay.tokenOverrides)) {
      const existingRule = rules.find((r) => r.scope === scope);
      const extracted = extractTokenSettings(overrides as any);

      if (existingRule && Object.keys(extracted).length > 0) {
        existingRule.settings = { ...existingRule.settings, ...extracted };
      } else if (Object.keys(extracted).length > 0) {
        rules.push({
          scope,
          settings: extracted,
        });
      }
    }
  }

  return rules;
}

import { Manifest } from "../core/manifest";
import { EditorOverlay } from "../core/overlay";
import { extractTokenSettings } from "../core/schemas";

export interface TokenSettings {
  foreground?: string;
  background?: string;
  fontStyle?: string;
  [key: string]: string | undefined;
}

export interface TokenRule {
  scope: string;
  settings: TokenSettings;
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
        settings: extracted as TokenSettings,
      });
    }
  }

  // Apply overrides from overlay
  if (overlay?.tokenOverrides) {
    for (const [scope, overrides] of Object.entries(overlay.tokenOverrides)) {
      const existingRule = rules.find((r) => r.scope === scope);
      const extracted = extractTokenSettings(overrides as Record<string, unknown>);

      if (existingRule && Object.keys(extracted).length > 0) {
        existingRule.settings = { ...existingRule.settings, ...(extracted as TokenSettings) };
      } else if (Object.keys(extracted).length > 0) {
        rules.push({
          scope,
          settings: extracted as TokenSettings,
        });
      }
    }
  }

  return rules;
}

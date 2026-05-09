import { Manifest } from "../core/manifest";
import { extractTokenSettings, filterNullColors } from "../core/schemas";

export interface VSCodeTheme {
  name: string;
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string | string[];
    settings: Record<string, string | number>;
  }>;
}

export function exportVSCode(manifest: Manifest): VSCodeTheme {
  const tokenColors: Array<{
    scope: string | string[];
    settings: Record<string, string | number>;
  }> = [];

  for (const [scope, settings] of Object.entries(manifest.tokens || {})) {
    const vsCodeSettings = extractTokenSettings(settings);
    if (Object.keys(vsCodeSettings).length > 0) {
      tokenColors.push({
        scope,
        settings: vsCodeSettings,
      });
    }
  }

  return {
    name: manifest.name,
    colors: filterNullColors(manifest.colors || {}),
    tokenColors,
  };
}

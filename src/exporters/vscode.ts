import { Manifest } from "../core/manifest";

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
    const vsCodeSettings: Record<string, string | number> = {};

    if (settings.foreground) {
      vsCodeSettings.foreground = settings.foreground;
    }
    if (settings.background) {
      vsCodeSettings.background = settings.background;
    }
    if (settings.fontStyle) {
      vsCodeSettings.fontStyle = settings.fontStyle;
    }
    if (settings.fontWeight) {
      vsCodeSettings.fontWeight = settings.fontWeight;
    }
    if (settings.opacity !== undefined) {
      vsCodeSettings.opacity = settings.opacity;
    }

    tokenColors.push({
      scope,
      settings: vsCodeSettings,
    });
  }

  return {
    name: manifest.name,
    colors: manifest.colors || {},
    tokenColors,
  };
}

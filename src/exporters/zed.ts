import { Manifest } from "../core/manifest";

export interface ZedTheme {
  name: string;
  appearance: "light" | "dark";
  colors: Record<string, string>;
  token_colors: Array<{
    scope: string | string[];
    settings: Record<string, string | number | boolean>;
  }>;
}

function detectAppearance(manifest: Manifest): "light" | "dark" {
  const bgColor = manifest.colors?.["editor.background"] || "#ffffff";
  const bgHex = bgColor.toLowerCase();
  const rgb = parseInt(bgHex.slice(1), 16);
  const brightness = (rgb >> 16 & 0xff) * 0.299 + (rgb >> 8 & 0xff) * 0.587 + (rgb & 0xff) * 0.114;
  return brightness > 128 ? "light" : "dark";
}

export function exportZed(manifest: Manifest): ZedTheme {
  const tokenColors: Array<{
    scope: string | string[];
    settings: Record<string, string | number | boolean>;
  }> = [];

  for (const [scope, settings] of Object.entries(manifest.tokens || {})) {
    const zedSettings: Record<string, string | number | boolean> = {};

    if (settings.foreground) {
      zedSettings.foreground = settings.foreground;
    }
    if (settings.background) {
      zedSettings.background = settings.background;
    }

    const fontStyles: string[] = [];
    if (settings.fontStyle && typeof settings.fontStyle === "string") {
      if (settings.fontStyle.includes("bold")) fontStyles.push("bold");
      if (settings.fontStyle.includes("italic")) fontStyles.push("italic");
      if (settings.fontStyle.includes("underline")) fontStyles.push("underline");
    }

    if (fontStyles.length > 0) {
      zedSettings.font_style = fontStyles.join(" ");
    }

    if (settings.opacity !== undefined) {
      zedSettings.opacity = settings.opacity;
    }

    tokenColors.push({
      scope,
      settings: zedSettings,
    });
  }

  return {
    name: manifest.name,
    appearance: detectAppearance(manifest),
    colors: manifest.colors || {},
    token_colors: tokenColors,
  };
}

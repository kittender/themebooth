import { Manifest } from "../core/manifest";
import { extractTokenSettings, filterNullColors } from "../core/schemas";

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
    const extracted = extractTokenSettings(settings);
    const zedSettings: Record<string, string | number | boolean> = {
      foreground: extracted.foreground,
      background: extracted.background,
      opacity: extracted.opacity,
    };

    const fontStyles: string[] = [];
    if (extracted.fontStyle && typeof extracted.fontStyle === "string") {
      if (extracted.fontStyle.includes("bold")) fontStyles.push("bold");
      if (extracted.fontStyle.includes("italic")) fontStyles.push("italic");
      if (extracted.fontStyle.includes("underline")) fontStyles.push("underline");
    }

    if (fontStyles.length > 0) {
      zedSettings.font_style = fontStyles.join(" ");
    }

    // Filter out undefined values
    const filtered: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(zedSettings)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }

    if (Object.keys(filtered).length > 0) {
      tokenColors.push({
        scope,
        settings: filtered,
      });
    }
  }

  return {
    name: manifest.name,
    appearance: detectAppearance(manifest),
    colors: filterNullColors(manifest.colors || {}),
    token_colors: tokenColors,
  };
}

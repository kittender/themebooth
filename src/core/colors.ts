// CSS color parsing and normalization to hex format
import { HEX_COLOR_REGEX } from "../utils/validation";

const namedColors: Record<string, string> = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
  white: "#ffffff",
  black: "#000000",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  teal: "#008080",
  navy: "#000080",
  fuchsia: "#ff00ff",
  purple: "#800080",
};

export interface ColorParseResult {
  hex: string;
  alpha?: number; // 0-1 for rgba
  changes: string[];
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toLowerCase()
  );
}

function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  if (h < 0) h += 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = h / 60;
  const intermediate = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;

  if (huePrime >= 0 && huePrime <= 1) {
    r = chroma;
    g = intermediate;
  } else if (huePrime > 1 && huePrime <= 2) {
    r = intermediate;
    g = chroma;
  } else if (huePrime > 2 && huePrime <= 3) {
    g = chroma;
    b = intermediate;
  } else if (huePrime > 3 && huePrime <= 4) {
    g = intermediate;
    b = chroma;
  } else if (huePrime > 4 && huePrime <= 5) {
    r = intermediate;
    b = chroma;
  } else if (huePrime > 5 && huePrime <= 6) {
    r = chroma;
    b = intermediate;
  }

  const lightnessPrime = l - chroma / 2;
  r = Math.round((r + lightnessPrime) * 255);
  g = Math.round((g + lightnessPrime) * 255);
  b = Math.round((b + lightnessPrime) * 255);

  return rgbToHex(r, g, b);
}

function alphaToHex(alpha: number): string {
  const hex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toLowerCase();
  return hex;
}

export function parseAndNormalizeColor(input: string): ColorParseResult | null {
  const trimmed = input.trim();

  // Already hex?
  if (HEX_COLOR_REGEX.test(trimmed)) {
    // Expand short hex if needed
    let normalized = trimmed.toLowerCase();
    if (normalized.length === 4) {
      // #RGB -> #RRGGBB
      normalized =
        "#" +
        normalized[1] +
        normalized[1] +
        normalized[2] +
        normalized[2] +
        normalized[3] +
        normalized[3];
    } else if (normalized.length === 5) {
      // #RGBA -> #RRGGBBAA
      normalized =
        "#" +
        normalized[1] +
        normalized[1] +
        normalized[2] +
        normalized[2] +
        normalized[3] +
        normalized[3] +
        normalized[4] +
        normalized[4];
    }
    return { hex: normalized, changes: [] };
  }

  // Named color?
  if (namedColors[trimmed.toLowerCase()]) {
    return {
      hex: namedColors[trimmed.toLowerCase()],
      changes: [`Converted from named color '${trimmed}'`],
    };
  }

  // rgb(r, g, b)?
  const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return {
        hex: rgbToHex(r, g, b),
        changes: [`Converted from rgb(${r}, ${g}, ${b})`],
      };
    }
  }

  // rgba(r, g, b, a)?
  const rgbaMatch = trimmed.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = parseFloat(rgbaMatch[4]);

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255 && a >= 0 && a <= 1) {
      const hex = rgbToHex(r, g, b);
      const alphaHex = alphaToHex(a);
      return {
        hex: hex + alphaHex,
        alpha: a,
        changes: [`Converted from rgba(${r}, ${g}, ${b}, ${a})`],
      };
    }
  }

  // hsl(h, s%, l%)?
  const hslMatch = trimmed.match(/^hsl\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);

    if (h >= 0 && h < 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      return {
        hex: hslToHex(h, s, l),
        changes: [`Converted from hsl(${h}, ${s}%, ${l}%)`],
      };
    }
  }

  // hsla(h, s%, l%, a)?
  const hslaMatch = trimmed.match(/^hsla\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)\s*\)$/i);
  if (hslaMatch) {
    const h = parseFloat(hslaMatch[1]);
    const s = parseFloat(hslaMatch[2]);
    const l = parseFloat(hslaMatch[3]);
    const a = parseFloat(hslaMatch[4]);

    if (h >= 0 && h < 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100 && a >= 0 && a <= 1) {
      const hex = hslToHex(h, s, l);
      const alphaHex = alphaToHex(a);
      return {
        hex: hex + alphaHex,
        alpha: a,
        changes: [`Converted from hsla(${h}, ${s}%, ${l}%, ${a})`],
      };
    }
  }

  return null;
}

export function validateColorFormat(input: string): { valid: boolean; suggestion?: string } {
  const result = parseAndNormalizeColor(input);
  if (result || input.match(/^\$[\w-]+$/)) {
    return { valid: true };
  }

  // Try to suggest a correction
  let suggestion: string | undefined;

  // Check for common typos in named colors
  for (const [name, hex] of Object.entries(namedColors)) {
    if (input.toLowerCase().includes(name.substring(0, 2))) {
      suggestion = `Did you mean: ${name} (${hex})?`;
      break;
    }
  }

  if (!suggestion && /^[0-9a-f]{6}$/i.test(input)) {
    suggestion = `Did you mean: #${input}?`;
  }

  return { valid: false, suggestion };
}

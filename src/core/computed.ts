import Color from "color";
import { ComputedEntry } from "./manifest";

export function applyColorTransform(
  hexColor: string,
  transform: "darken" | "lighten" | "alpha",
  amount: number
): string {
  // amount is in 0-100 scale; convert to 0-1 ratio for color operations
  const ratio = amount / 100;

  try {
    const color = Color(hexColor);

    switch (transform) {
      case "darken":
        return color.darken(ratio).hex();
      case "lighten":
        return color.lighten(ratio).hex();
      case "alpha":
        return color.alpha(ratio).hexa();
      default:
        throw new Error(`Unknown transform: ${transform}`);
    }
  } catch (error) {
    throw new Error(`Failed to apply ${transform} transform to ${hexColor}: ${String(error)}`);
  }
}

export function resolveComputedColors(
  computed: Record<string, ComputedEntry>,
  resolvedVariables: Record<string, string>
): Record<string, string> {
  const result = { ...resolvedVariables };

  for (const [computedName, entry] of Object.entries(computed)) {
    let baseColor: string;

    // Resolve base value
    if (entry.base.startsWith("$")) {
      const varName = entry.base.slice(1); // Remove the $
      // Look in both original variables and newly computed colors
      if (varName in result) {
        baseColor = result[varName];
      } else {
        throw new Error(
          `Computed color "${computedName}" references undefined variable "${varName}"`
        );
      }
    } else {
      // Treat as literal hex color
      baseColor = entry.base;
      // Validate it's a valid hex
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(baseColor)) {
        throw new Error(
          `Computed color "${computedName}" has invalid base value "${entry.base}" (not a variable or hex color)`
        );
      }
    }

    // Apply transform
    const computedColor = applyColorTransform(baseColor, entry.transform, entry.amount);
    result[computedName] = computedColor;
  }

  return result;
}

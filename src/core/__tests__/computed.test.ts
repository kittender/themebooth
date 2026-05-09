import { describe, it, expect } from "@jest/globals";
import { applyColorTransform, resolveComputedColors } from "../computed";
import { ComputedEntry } from "../manifest";

describe("applyColorTransform", () => {
  it("darkens a color", () => {
    const result = applyColorTransform("#569cd6", "darken", 20);
    // Darken by 20% should produce a darker shade
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    // The result should be darker than the input
    // Convert both to check luminosity
    const original = parseInt("#569cd6".substring(1), 16);
    const darkened = parseInt(result.substring(1), 16);
    expect(darkened).toBeLessThan(original);
  });

  it("lightens a color", () => {
    const result = applyColorTransform("#1a1a1a", "lighten", 30);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    const original = parseInt("#1a1a1a".substring(1), 16);
    const lightened = parseInt(result.substring(1), 16);
    expect(lightened).toBeGreaterThan(original);
  });

  it("applies alpha transform returning 8-digit hex", () => {
    const result = applyColorTransform("#ff0000", "alpha", 50);
    expect(result).toMatch(/^#[0-9a-fA-F]{8}$/);
    expect(result.length).toBe(9); // # + 8 digits
  });

  it("throws for invalid hex input", () => {
    expect(() => applyColorTransform("not-a-color", "darken", 10)).toThrow();
  });

  it("throws for unknown transform", () => {
    expect(() => applyColorTransform("#ffffff", "unknownTransform" as any, 10)).toThrow();
  });

  it("handles 3-digit hex colors", () => {
    const result = applyColorTransform("#fff", "darken", 10);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("resolveComputedColors", () => {
  it("resolves computed colors from base hex", () => {
    const computed: Record<string, ComputedEntry> = {
      "color-accent-hover": {
        base: "#569cd6",
        transform: "darken",
        amount: 15,
      },
    };
    const variables = { existing: "#ffffff" };

    const result = resolveComputedColors(computed, variables);
    expect(result.existing).toBe("#ffffff");
    expect(result["color-accent-hover"]).toBeDefined();
    expect(result["color-accent-hover"]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("resolves computed colors from variable reference", () => {
    const computed: Record<string, ComputedEntry> = {
      "color-accent-hover": {
        base: "$color-accent",
        transform: "darken",
        amount: 15,
      },
    };
    const variables = { "color-accent": "#569cd6", other: "#111" };

    const result = resolveComputedColors(computed, variables);
    expect(result["color-accent"]).toBe("#569cd6");
    expect(result["color-accent-hover"]).toBeDefined();
    expect(result.other).toBe("#111");
  });

  it("throws for undefined variable reference", () => {
    const computed: Record<string, ComputedEntry> = {
      "color-hover": {
        base: "$undefined-var",
        transform: "darken",
        amount: 10,
      },
    };
    const variables = { other: "#fff" };

    expect(() => resolveComputedColors(computed, variables)).toThrow(
      /undefined variable/
    );
  });

  it("throws for invalid base value", () => {
    const computed: Record<string, ComputedEntry> = {
      "color-invalid": {
        base: "not-a-hex-or-var",
        transform: "darken",
        amount: 10,
      },
    };
    const variables = {};

    expect(() => resolveComputedColors(computed, variables)).toThrow(
      /invalid base value/
    );
  });

  it("handles multiple computed colors", () => {
    const computed: Record<string, ComputedEntry> = {
      "color-dark": {
        base: "#569cd6",
        transform: "darken",
        amount: 20,
      },
      "color-light": {
        base: "#569cd6",
        transform: "lighten",
        amount: 20,
      },
      "color-transparent": {
        base: "$color-dark",
        transform: "alpha",
        amount: 50,
      },
    };
    const variables = {};

    const result = resolveComputedColors(computed, variables);
    expect(Object.keys(result)).toContain("color-dark");
    expect(Object.keys(result)).toContain("color-light");
    expect(Object.keys(result)).toContain("color-transparent");
    expect(result["color-transparent"]).toMatch(/^#[0-9a-fA-F]{8}$/);
  });

  it("preserves original variables in result", () => {
    const computed: Record<string, ComputedEntry> = {
      "color-new": {
        base: "#fff",
        transform: "darken",
        amount: 5,
      },
    };
    const variables = { "color-original": "#123456", "color-another": "#abcdef" };

    const result = resolveComputedColors(computed, variables);
    expect(result["color-original"]).toBe("#123456");
    expect(result["color-another"]).toBe("#abcdef");
  });
});

/* Barefoot — W3C Design Tokens Format (DTCG) export (v4.8).
   Emits dist/tokens.json: the --bf-* tokens from src/tokens.css as a
   standards-format JSON file that multi-platform design systems can
   sync to Figma, iOS (SwiftUI) and Android (Compose).

   Shape: top-level `light` and `dark` groups hold the color tokens
   resolved per color scheme (light-dark() pairs are split, var()
   aliases resolved, color-mix() fallbacks mixed out to hex); `core`
   holds the scheme-independent tokens (spacing, radii, type, motion,
   shadows…). The oklch() Chroma derivations are represented by their
   color-mix() fallbacks — those are the canonical non-oklch values.

   Pure module: buildDTCG() returns the object (used by build.mjs and
   the tests); the CLI entry writes nothing.

   Zero deps. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = join(root, "src", "tokens.css");

const SECTION = /^\s*\/\*\s*-+\s*(.+?)\s*-+\s*(?:\*\/)?\s*$/;
const CUSTOM_PROP = /^\s*(--bf-[a-z0-9-]+):/;

/* ---- token source parse ----
   First :root block only (up to the density presets) — the @supports
   oklch block re-declares the same names with engine-only values; the
   color-mix fallbacks are canonical for the export. First declaration
   of a name wins. Section headers may span lines: the title sits on
   the dashed line, and the closing comment marker (plus the
   description prose) is consumed without becoming tokens. */
function parseGroups(source) {
  const start = source.indexOf(":root {");
  const end = source.indexOf("/* ---- Density presets");
  if (start === -1 || end === -1) throw new Error("src/tokens.css shape changed");
  const body = source.slice(start, end);

  const groups = [];
  let current = null;
  let buffer = "";
  let inHeader = false;
  const seen = new Set();

  for (const line of body.split("\n")) {
    if (inHeader) {
      if (line.includes("*/")) inHeader = false;
      continue;
    }
    if (buffer || CUSTOM_PROP.test(line)) {
      buffer += ` ${line.trim()}`;
      if (!buffer.includes(";")) continue;
      const decl = buffer;
      buffer = "";
      const [, name] = decl.match(CUSTOM_PROP);
      // First declaration of a name wins — the @supports oklch block
      // re-declares the Chroma tokens with engine-only values; the
      // color-mix fallbacks above are canonical for the export.
      if (!current || seen.has(name)) continue;
      seen.add(name);
      const value = decl
        .slice(decl.indexOf(":") + 1, decl.indexOf(";"))
        .replace(/\s+/g, " ")
        .trim();
      const description = decl.match(/;\s*\/\*\s*(.*?)\s*\*\//)?.[1] ?? "";
      current.rows.push({ name, value, description });
      continue;
    }
    const header = line.match(SECTION);
    if (header) {
      if (!line.includes("*/")) inHeader = true;
      current = { title: header[1], rows: [] };
      groups.push(current);
    }
  }
  return groups.filter((g) => g.rows.length > 0);
}

/* ---- color resolution ---- */

/* Split on top-level commas only (rgb(0 0 0 / 0.5) survives). */
function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current.trim());
  return parts;
}

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, h.length === 4 ? 4 : 3)
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h.slice(0, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
    a,
  };
}

function toLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function fromLinear(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.min(255, Math.max(0, v * 255)));
}

/* sRGB <-> OKLab (Björn Ottosson's matrices, the same math
   `color-mix(in oklab, …)` runs in the browser). */
function rgbToOklab({ r, g, b, a }) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    A: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    B: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    a,
  };
}

function oklabToRgb({ L, A, B, a }) {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a,
  };
}

function toHex({ r, g, b, a }) {
  const base =
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  if (a >= 1) return base;
  const alpha = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return base + alpha;
}

function parseRgb(value) {
  const m = value
    .replace(/^rgba?\(/, "")
    .replace(/\)$/, "")
    .split("/")
    .map((p) => p.trim());
  const [r, g, b] = m[0].split(/\s+/).map(parseFloat);
  const a = m[1] !== undefined ? parseFloat(m[1]) : 1;
  return { r, g, b, a };
}

/* color-mix(in oklab, A, B N%) with premultiplied alpha (CSS spec). */
function mixOklab(aValue, bValue, weightB) {
  const a = rgbToOklab(aValue);
  const b = rgbToOklab(bValue);
  const wA = 1 - weightB;
  const pA = wA * a.a;
  const pB = weightB * b.a;
  const alpha = pA + pB;
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (ca, cb) => (pA * ca + pB * cb) / alpha;
  return oklabToRgb({
    L: mix(a.L, b.L),
    A: mix(a.A, b.A),
    B: mix(a.B, b.B),
    a: alpha,
  });
}

/* Resolve a color-ish value to a hex string per scheme. Returns a
   plain value (string) for anything that is not a color. */
function resolveColor(value, tokens, mode, seen = new Set()) {
  const v = value.trim();

  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return toHex(hexToRgb(v));
  if (v === "transparent") return toHex({ r: 0, g: 0, b: 0, a: 0 });

  const rgb = v.match(/^rgba?\(/);
  if (rgb) return toHex(parseRgb(v));

  if (v.startsWith("light-dark(")) {
    const args = splitTopLevel(v.slice("light-dark(".length, -1));
    return resolveColor(mode === "dark" ? args[1] : args[0], tokens, mode, seen);
  }

  const mix = v.match(/^color-mix\(\s*in\s+oklab\s*,\s*(.+)\)$/);
  if (mix) {
    const args = splitTopLevel(mix[1]);
    const weightMatch = args[args.length - 1].match(/\s(-?[\d.]+)%$/);
    const weightB = weightMatch ? parseFloat(weightMatch[1]) / 100 : 0.5;
    const second = weightMatch
      ? args[args.length - 1].slice(0, weightMatch.index)
      : args[1] ?? "";
    const first = args[0];
    const left = resolveColor(first, tokens, mode, seen);
    const right = resolveColor(second, tokens, mode, seen);
    if (typeof left !== "string" || typeof right !== "string") return null;
    return toHex(
      mixOklab(hexToRgb(left), hexToRgb(right), Math.max(0, Math.min(1, weightB)))
    );
  }

  if (v.startsWith("var(")) {
    const alias = v.match(/var\((--bf-[a-z0-9-]+)\)/)?.[1];
    if (!alias || !tokens.has(alias) || seen.has(alias)) return null;
    seen.add(alias);
    return resolveColor(tokens.get(alias), tokens, mode, seen);
  }

  return null; // not a resolvable color (dimension, duration, shadow…)
}

/* ---- type classification ---- */

function parseShadowLayer(layer) {
  // "0 1px 2px rgb(0 0 0 / 0.25)" → { offsetX, offsetY, blur, spread, color }
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of layer) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (/\s/.test(ch) && depth === 0 && current) {
      parts.push(current);
      current = "";
    } else if (!(depth === 0 && /\s/.test(ch))) {
      current += ch;
    }
  }
  if (current) parts.push(current);
  const color = parts[parts.length - 1];
  const lengths = parts.slice(0, -1);
  return {
    offsetX: lengths[0] ?? "0",
    offsetY: lengths[1] ?? "0",
    blur: lengths[2] ?? "0",
    spread: lengths[3] ?? "0",
    color: /^#/.test(color) ? color : resolveColor(color, new Map(), "light") ?? color,
  };
}

function classify(name, value, tokens, mode) {
  const v = value.trim();

  if (name.startsWith("--bf-shadow")) {
    if (v === "none") return { type: null, value: "none" };
    const layers = v.includes("),")
      ? v.split(/,(?=\s*[\d.])/).map((l) => parseShadowLayer(l.trim()))
      : [parseShadowLayer(v)];
    return { type: "shadow", value: layers.length === 1 ? layers[0] : layers };
  }

  if (name.startsWith("--bf-font-weight")) {
    return { type: "fontWeight", value: parseFloat(v) };
  }

  if (name === "--bf-font" || name === "--bf-font-mono") {
    return { type: "fontFamily", value: v };
  }

  // Motion shorthand: "150ms ease" → duration token + easing extension.
  const motion = v.match(/^([\d.]+m?s)\s+(.+)$/);
  if (motion && /ms$|^\d+(\.\d+)?s$/.test(motion[1])) {
    return {
      type: "duration",
      value: motion[1],
      extensions: { "com.barefoot-css.easing": motion[2] },
    };
  }
  if (/^[\d.]+m?s$/.test(v)) return { type: "duration", value: v };

  // Resolve var() aliases so dimensions and numbers classify too
  // (e.g. --bf-grid-gap: var(--bf-space-4) → 1rem). Color resolution
  // walks aliases itself, so this only feeds the branches below.
  let resolved = v;
  const seen = new Set([name]);
  while (resolved.startsWith("var(")) {
    const alias = resolved.match(/var\((--bf-[a-z0-9-]+)\)/)?.[1];
    if (!alias || !tokens.has(alias) || seen.has(alias)) break;
    seen.add(alias);
    resolved = tokens.get(alias).trim();
  }

  const color = resolveColor(resolved, tokens, mode);
  if (typeof color === "string") return { type: "color", value: color };

  // Fluid type steps are clamp() expressions of lengths — dimensions.
  if (resolved.startsWith("clamp(") || /(rem|px|em|vw|vh|ch|cqi)%?$/.test(resolved) || /%/.test(resolved)) {
    return { type: "dimension", value: resolved };
  }

  const num = parseFloat(resolved);
  if (!Number.isNaN(num) && /^[\d.-]+$/.test(resolved.trim())) {
    return { type: "number", value: num };
  }

  return { type: null, value: v };
}

/* ---- DTCG assembly ---- */

const EXT = "com.barefoot-css.css-name";

function tokenEntry(row, tokens, mode) {
  const { type, value, extensions } = classify(row.name, row.value, tokens, mode);
  const entry = {};
  if (type) entry.$type = type;
  entry.$value = value;
  if (row.description) entry.$description = row.description;
  entry.$extensions = { [EXT]: row.name };
  if (extensions) Object.assign(entry.$extensions, extensions);
  return entry;
}

export function buildDTCG() {
  const groups = parseGroups(readFileSync(TOKENS, "utf8"));

  // Flat name → value map for alias resolution + classification.
  const tokens = new Map();
  for (const g of groups) for (const row of g.rows) {
    if (!tokens.has(row.name)) tokens.set(row.name, row.value);
  }

  const light = {};
  const dark = {};
  const core = {};

  for (const group of groups) {
    for (const mode of ["light", "dark"]) {
      const bucket = mode === "light" ? light : dark;
      for (const row of group.rows) {
        const entry = tokenEntry(row, tokens, mode);
        const isColor = entry.$type === "color";
        const target = isColor ? bucket : core;
        target[group.title] ??= {};
        target[group.title][row.name.replace(/^--bf-/, "")] = entry;
      }
    }
  }

  return {
    $description:
      "Barefoot CSS design tokens (W3C Design Tokens Format). " +
      "Generated from src/tokens.css by build/build.mjs — do not edit; " +
      "change the token and rebuild. `light`/`dark` hold the color tokens " +
      "resolved per color scheme; `core` holds scheme-independent tokens. " +
      "The oklch() Chroma derivations ship as their color-mix() fallbacks. " +
      "The [data-bf-theme=\"contrast\"] and prefers-contrast overrides are " +
      "theme variants, not part of the base export.",
    light,
    dark,
    core,
  };
}

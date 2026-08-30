/* Barefoot — Chroma contrast guard (v4.7).
   Checks every generated text-on-background pair for AA (4.5:1).
   Used by build/size.mjs (hard fail) and build/token-docs.mjs (warn).

   Pure JS, zero deps. Parses hex from light-dark() or plain hex.
   Skips tokens that resolve to color-mix/oklch at build time — those
   are browser-computed; the guard warns only on resolvable hex pairs.
*/

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = join(root, "src", "tokens.css");

// Pairs: [foreground, background]
const PAIRS = [
  ["--bf-primary-fg", "--bf-primary"],
  ["--bf-primary-contrast", "--bf-primary"],
  ["--bf-text", "--bf-surface"],
  ["--bf-muted", "--bf-surface"],
  ["--bf-muted", "--bf-surface-alt"],
  ["--bf-danger-fg", "--bf-danger"],
  ["--bf-success-fg", "--bf-success"],
  ["--bf-info-fg", "--bf-info"],
  ["--bf-warning-fg", "--bf-warning"],
];

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join(""); // ignore alpha
  if (h.length > 6) h = h.slice(0, 6);
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
function contrastRatio(l1, l2) {
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

function extractHexes(value) {
  // light-dark(#fff, #000) -> ["#fff","#000"]
  // plain #fff -> ["#fff"]
  // transparent/color-mix/oklch -> []
  if (!value) return [];
  const hexes = [...value.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]);
  if (value.includes("light-dark")) {
    // Expect 2 hexes in order light,dark
    return hexes.slice(0, 2);
  }
  return hexes.slice(0, 1);
}

function parseTokens() {
  const src = readFileSync(TOKENS, "utf8");
  const start = src.indexOf(":root {");
  if (start === -1) return new Map();
  const body = src.slice(start, src.indexOf("/* ---- Density presets"));
  const map = new Map();
  for (const m of body.matchAll(/(--bf-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const name = m[1];
    const val = m[2].trim();
    // Keep the hex fallback, not the oklch override (second :root block redefines same token with oklch)
    if (map.has(name) && val.includes("oklch")) continue;
    map.set(name, val);
  }
  return map;
}

export function checkContrast({ strict = false } = {}) {
  const tokens = parseTokens();
  const failures = [];
  const warnings = [];

  for (const [fg, bg] of PAIRS) {
    const fgVal = tokens.get(fg);
    const bgVal = tokens.get(bg);
    if (!fgVal || !bgVal) continue;
    // Skip oklch-derived tokens at build time — browser computes them
    if (fgVal.includes("oklch") || bgVal.includes("oklch")) continue;
    // Alias fallback: --bf-primary-contrast: var(--bf-primary-fg)
    let fgHexes = extractHexes(fgVal);
    let bgHexes = extractHexes(bgVal);
    if (fgVal.trim().startsWith("var(")) {
      const alias = fgVal.match(/var\((--bf-[a-z0-9-]+)\)/)?.[1];
      if (alias && tokens.has(alias)) fgHexes = extractHexes(tokens.get(alias));
    }
    if (bgVal.trim().startsWith("var(")) {
      const alias = bgVal.match(/var\((--bf-[a-z0-9-]+)\)/)?.[1];
      if (alias && tokens.has(alias)) bgHexes = extractHexes(tokens.get(alias));
    }
    // No resolvable hex -> skip (color-mix derived at runtime)
    if (fgHexes.length === 0 || bgHexes.length === 0) continue;

    // Schemes: light = hexes[0], dark = hexes[1] or hexes[0] if single
    const schemes = [];
    if (fgHexes.length === 1 && bgHexes.length === 1) {
      schemes.push(["light", fgHexes[0], bgHexes[0]]);
    } else {
      const fLight = fgHexes[0], fDark = fgHexes[1] || fgHexes[0];
      const bLight = bgHexes[0], bDark = bgHexes[1] || bgHexes[0];
      schemes.push(["light", fLight, bLight]);
      schemes.push(["dark", fDark, bDark]);
    }

    for (const [scheme, fHex, bHex] of schemes) {
      const fLum = luminance(hexToRgb(fHex));
      const bLum = luminance(hexToRgb(bHex));
      const ratio = contrastRatio(fLum, bLum);
      const ok = ratio >= 4.5;
      const label = `${fg} on ${bg} (${scheme}: ${fHex} / ${bHex}) → ${ratio.toFixed(2)}:1`;
      if (!ok) {
        const msg = `[contrast] ${label} — FAIL (<4.5:1). Fix: adjust l by ±0.08 — e.g. oklch(from var(${bg}) calc(l - 0.08) c h) or tweak ${fg} lightness.`;
        if (strict) failures.push(msg);
        else warnings.push(msg);
      }
    }
  }

  for (const w of warnings) console.warn(w);
  for (const f of failures) console.error(f);
  return { failures, warnings, ok: failures.length === 0 && warnings.length === 0 };
}

if (import.meta.main) {
  const strict = process.argv.includes("--strict");
  const { failures, warnings } = checkContrast({ strict });
  const totalFails = strict ? failures.length : warnings.length;
  if (totalFails > 0 && strict) process.exit(1);
}

# Barefoot — API Reference (v2.0 Frozen)

As of v2.0.0, Barefoot's public API is frozen. This document defines
what is stable, what may change, and the deprecation policy.

## Stability tiers

### Stable — will not break in 2.x

These are the contracts consumers build on:

- **`--bf-*` tokens.** Every token listed in [theming.md](theming.md)
  is part of the public API. New tokens may be added in minor releases;
  existing tokens will not be renamed or removed in 2.x.
- **`data-*` component attributes.** The attribute names and their
  enumerated values (e.g. `[data-variant]`, `[data-grid]`,
  `[data-bf-theme]`, `[data-switch]`, `[data-menu]`) are frozen.
- **CSS export map.** The entry points in `package.json` `exports` are
  stable: `barefoot-css` (core), `barefoot-css/full.css`,
  `barefoot-css/utilities.css`, `barefoot-css/components/*`,
  `barefoot-css/themes/*`, `barefoot-css/js/*`.
- **JS module API.** Each `js/*.js` module exports an `init*` function
  for dynamic content. The function signatures will not change in 2.x.
- **Cascade layer order.** `@layer reset, tokens, base, components,
  utilities` is the declared and frozen order.

### Unstable — may change in minor releases

- **`src/*` passthrough.** The `barefoot-css/src/*` export exposes raw
  source for inspection and forking. Source structure may shift between
  minor versions.
- **Internal `color-mix()` derivations.** Alpha ramp tokens
  (`--bf-primary-muted`, etc.) are computed from base tokens. Their
  exact values may be tweaked for visual quality; the derivation
  pattern (base token → mix) will not change.

### Internal — not part of the API

- **`dist/` file paths within entries.** The build output structure
  (e.g. individual component file names) may change. Always import
  via the export map, never via direct `dist/` paths.
- **`@property` registrations.** None are shipped (`docs/adr/0005`);
  their presence or absence does not affect the API.

## Deprecation policy

Barefoot v2 promises **no silent breaks.**

1. **Announce.** A deprecated token, attribute, or export is announced
   in the CHANGELOG with the replacement and the version it will be
   removed.
2. **Grace period.** Deprecated items remain functional for at least
   one minor version after the announcement (e.g. deprecated in 2.1,
   removed in 2.3 minimum).
3. **Migration path.** Every deprecation ships a concrete replacement.
   If no replacement exists, the item is not deprecated — it stays.

## Export map

```json
{
  ".": "./dist/index.css",
  "./full.css": "./dist/full.css",
  "./utilities.css": "./dist/utilities.css",
  "./components/*": "./dist/components/*",
  "./themes/*": "./dist/themes/*",
  "./js/*": "./dist/js/*",
  "./src/*": "./src/*"
}
```

| Import specifier | What it resolves to |
|---|---|
| `"barefoot-css"` | Core: layers + reset + tokens + base |
| `"barefoot-css/full.css"` | Everything: core + all components + utilities |
| `"barefoot-css/utilities.css"` | Utility classes only |
| `"barefoot-css/components/dialog.css"` | Any single component |
| `"barefoot-css/themes/editorial.css"` | Any starter theme |
| `"barefoot-css/js/barefoot.js"` | All JS modules bundled |
| `"barefoot-css/src/tokens.css"` | Raw source (unstable) |

## data-* attribute reference

All component attributes and their valid values:

| Attribute | Element(s) | Values | Since |
|---|---|---|---|
| `data-bf-theme` | `<html>` | `auto`, `light`, `dark`, `contrast`, `editorial`, `dashboard`, `playful`, `forest`, `custom` | 0.1 |
| `data-variant` | `<button>` | `primary`, `danger`, `ghost` | 0.1 |
| `data-size` | `<button>`, `.bf-avatar`, `[data-spinner]` | `sm`, `lg` | 0.1 |
| `data-grid` | any container | `auto-fit`, `auto-fill`, `1`–`4` (column count) | 0.1 |
| `data-gap` | `[data-grid]` | `0`–`8` | 1.6 |
| `data-table` | `<table>` | `stack` | 1.1 |
| `data-nav` | `<header>`, `<footer>` | `header`, `footer` | 1.6 |
| `data-switch` | `input[type="checkbox"]` | (boolean) | 1.1 |
| `data-menu` | `<details>` | (boolean) | 0.1 |
| `data-accordion` | `<details>` | (boolean) | 0.1 |
| `data-autogrow` | `<textarea>` | (boolean) | 1.5 |
| `data-stepper` | `<ol>` | (boolean) | 1.9 |
| `data-orientation` | `[data-stepper]` | `vertical` | 1.9 |
| `data-input-group` | wrapper div | (boolean) | 1.9 |
| `data-alert` | any element | `danger`, `success`, `info`, `warning` | 1.7 |
| `data-alert-dismiss` | child of `[data-alert]` | (boolean) | 1.7 |
| `data-kind` | `[popover]` | `toast`, `tooltip` | 1.7 |
| `data-tooltip` | trigger element | (boolean) | 1.4 |
| `data-media` | `<img>`, `<video>`, `.card` | (boolean) | 1.8 |
| `data-ratio` | `[data-media]` | `4/3`, `1/1`, `21/9` | 1.8 |
| `data-spinner` | any element | (boolean) | 2.4 |
| `data-divider` | any text-holding element | (boolean) | 2.4 |
| `data-chip` | any text-holding element | (boolean) | 2.6 |
| `data-chip-remove` | child of `[data-chip]` | (boolean) | 2.6 |
| `data-bf-tabs` | tabs container | (boolean) | 0.1 |
| `data-carousel` | scroll container | (boolean) | 1.4 |
| `data-autoplay` | `[data-carousel]` | `ms` value (default 3000) | 1.4 |
| `data-carousel-prev` | button | (boolean) | 1.4 |
| `data-carousel-next` | button | (boolean) | 1.4 |
| `data-breadcrumbs` | `<nav>` | (boolean) | 1.4 |
| `data-pagination` | `<nav>` | (boolean) | 1.4 |
| `data-striped` | `<table>` | (boolean) | 0.1 |
| `data-step` | `<li>` in `[data-stepper]` | (boolean) | 1.9 |
| `data-step-circle` | child of `[data-step]` | (boolean) | 1.9 |
| `data-step-label` | child of `[data-step]` | (boolean) | 1.9 |
| `data-complete` | `<li>` in `[data-stepper]` | (boolean) | 1.9 |
| `data-width` | `<dialog>` | `sm`, `lg` | 0.1 |
| `data-lifted` | any element | (boolean) | 0.1 |
| `data-bf-theme-btn` | theme switcher buttons | theme name | — |

### Internal markers (not consumer API)

Three attributes are seams between an opt-in JS module and its CSS —
the module sets them, the stylesheet keys off them. They appear in
`src/` but are not part of the public API; never author them by hand:

- `data-bf-tabs-js` — set on `[data-bf-tabs]` by `js/tabs.js`
- `data-nav-js` / `data-open` — set on `[data-nav="header"]` by `js/nav.js`

The API reference audit (`tests/css.spec.js`) enforces this table
against `src/`: every attribute documented here must be implemented,
and everything implemented must be documented here or listed above.
A parity test also pins the generated token tables in
[theming.md](theming.md) against `src/tokens.css`.

## v1.x → v2.0 migration

**Nothing changed.** v2.0 is a stability declaration, not a breaking
release. If your app works on 1.9, it works on 2.0 with zero changes.

What's new:
- **Alpha ramp tokens** (`--bf-primary-muted`, `--bf-surface-2`, etc.)
  are available for custom components. They derive from base tokens, so
  overriding `--bf-primary` still recolors everything.
- **`--bf-backdrop`** replaces the hardcoded dialog backdrop color.
- **`--bf-shadow-sm`** replaces hardcoded small shadows.
- **API stability** is now a formal contract (this document).

Upgrade:
```bash
npm install barefoot-css@^2.0.0
```

No code changes needed.

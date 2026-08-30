# Barefoot — API Reference (v4.7)

As of v4.0.0, Barefoot's public API is frozen. This document defines
what is stable, what may change, and the deprecation policy.

## Stability tiers

### Stable — will not break in 4.x

These are the contracts consumers build on:

- **`--bf-*` tokens.** Every token listed in [theming.md](theming.md)
   is part of the public API. New tokens may be added in minor releases;
   existing tokens will not be renamed or removed in 4.x.
- **`data-*` component attributes.** The attribute names and their
  enumerated values (e.g. `[data-variant]`, `[data-grid]`,
  `[data-bf-theme]`, `[data-switch]`, `[data-menu]`) are frozen.
- **CSS export map.** The entry points in `package.json` `exports` are
  stable: `barefoot-css` (core), `barefoot-css/full.css`,
  `barefoot-css/utilities.css`, `barefoot-css/components/*`,
  `barefoot-css/themes/*`, `barefoot-css/js/*`.
- **JS module API.** Each `js/*.js` module exports an `init*` function
  for dynamic content. The function signatures will not change in 4.x.
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

Barefoot promises **no silent breaks.**

1. **Announce.** A deprecated token, attribute, or export is announced
   in the CHANGELOG with the replacement and the version it will be
   removed. Announcements land in three places at once: a CHANGELOG
   entry, a row in the [deprecation table](#deprecations), and a
   once-per-page `console.warn` from any opt-in module that arms
   against the deprecated markup.
2. **Grace period.** Deprecated items remain functional for at least
   one minor version after the announcement (e.g. deprecated in 2.1,
   removed in 2.3 minimum). In practice majors are the only removal
   vehicles since v2 froze the API.
3. **Migration path.** Every deprecation ships a concrete replacement.
   If no replacement exists, the item is not deprecated — it stays.
4. **Detect.** `npm run migrate:v4 -- <paths>` scans consumer code for
   every announced surface (detection pass; `--write` arrives with
   docs/migration-4.md at 3.5).

## Deprecations

All previously deprecated surfaces have been removed in 4.0:

| Deprecated | Announced | Removed | Replacement |
|---|---|---|---|
| `<details data-menu>` dropdowns | 3.2 | **4.0** | Popover-API menus: `<button popovertarget>` + `<div popover data-kind="menu">` |
| `js/details-close.js` | 3.2 | **4.0** | Dies with the details-menu pattern; popover menus close natively |
| `js/details-tabindex.js` | 3.2 | **4.0** | None needed — WebKit tab-order fixed in Safari 17.4+ |
| `js/popover-anchor.js` | 3.2 | **4.0** | None needed — `position-visibility: anchors-visible` is Baseline 2026 |

All deprecated surfaces have been removed in 4.0. See
[migration-4.md](migration-4.md) for the full migration guide.

## Export map

```json
{
  ".": "./dist/index.css",
  "./full.css": "./dist/full.css",
  "./utilities.css": "./dist/utilities.css",
  "./components/*": "./dist/components/*",
  "./themes/*": "./dist/themes/*",
  "./js/*": "./dist/js/*",
  "./tokens.json": "./dist/tokens.json",
  "./src/*": "./src/*"
}
```

| Import specifier | What it resolves to |
|---|---|
| `"barefoot-css"` | Core: layers + reset + tokens + base |
| `"barefoot-css/full.css"` | Everything: core + all components + utilities. **Frozen since v4.6** (ADR-0008) — no new components join it; import per-component instead |
| `"barefoot-css/utilities.css"` | Utility classes only |
| `"barefoot-css/components/dialog.css"` | Any single component |
| `"barefoot-css/themes/editorial.css"` | Any starter theme |
| `"barefoot-css/js/barefoot.js"` | All JS modules bundled |
| `"barefoot-css/tokens.json"` | The `--bf-*` tokens as a W3C DTCG design-token file (v4.8) |
| `"barefoot-css/src/tokens.css"` | Raw source (unstable) |

## data-* attribute reference

All component attributes and their valid values:

| Attribute | Element(s) | Values | Since |
|---|---|---|---|
| `data-bf-theme` | `<html>` | `auto`, `light`, `dark`, `contrast`, `editorial`, `dashboard`, `playful`, `forest`, `sunset`, `coastal`, `custom` | 0.1 |
| `data-variant` | `<button>` | `primary`, `danger`, `ghost` | 0.1 |
| `data-size` | `<button>`, `.bf-avatar`, `[data-spinner]`, `[data-icon]` | `sm`, `lg` | 0.1 |
| `data-grid` | any container | `auto-fit`, `auto-fill`, `masonry`, `1`–`4` (column count) | 0.1 |
| `data-gap` | `[data-grid]` | `0`–`8` | 1.6 |
| `data-table` | `<table>` | `stack`, `sticky-head`, `sticky-col` (compose, e.g. `"sticky-head sticky-col"`) | 1.1 |
| `data-nav` | `<header>`, `<footer>` | `header`, `footer` | 1.6 |
| `data-switch` | `input[type="checkbox"]` | (boolean) | 1.1 |
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
| `data-progress` | `[data-carousel]` | (boolean) | 3.1 |
| `data-reveal` | any element | (boolean) | 3.1 |
| `data-breadcrumbs` | `<nav>` | (boolean) | 1.4 |
| `data-pagination` | `<nav>` | (boolean) | 1.4 |
| `data-striped` | `<table>` | (boolean) | 0.1 |
| `data-bf-sort` | `<table>` | (boolean) | 3.3 |
| `data-segmented` | `<fieldset>` | (boolean) | 3.3 |
| `data-timeline` | `<ol>` | (boolean) | 3.3 |
| `data-density` | `<html>` | `compact` | 3.4 |
| `data-layout` | wrapper div | `sidebar` | 4.3 |
| `data-area` | child of `[data-layout]` | `header`, `nav`, `main`, `aside`, `footer` | 4.3 |
| `data-collapse` | `[data-layout="sidebar"]` | (boolean) | 4.3 |
| `data-collapsed` | `[data-layout="sidebar"]` | (boolean) | 4.3 |
| `data-shape` | `.skeleton` | `circle`, `text`, `card` | 4.2 |
| `data-reveal` | any element | `left`, `right`, `up`, `down`, `fade` (boolean = up) | 3.1, 4.4 |
| `data-reveal-group` | container | (boolean) | 4.4 |
| `data-progress` | scroll container | `top`, `bottom` (boolean = bottom) | 4.4 |
| `data-parallax` | decorative element | (boolean) | 4.4 |
| `data-duration` | `[popover][data-kind="toast"]` | `ms` value (default 3000) | 4.2 |
| `data-toast-progress` | child of `[data-toast]` | (boolean) | 4.2 |
| `data-step` | `<li>` in `[data-stepper]` | (boolean) | 1.9 |
| `data-step-circle` | child of `[data-step]` | (boolean) | 1.9 |
| `data-step-label` | child of `[data-step]` | (boolean) | 1.9 |
| `data-complete` | `<li>` in `[data-stepper]` | (boolean) | 1.9 |
| `data-width` | `<dialog>` | `sm`, `lg` | 0.1 |
| `data-lifted` | any element | (boolean) | 0.1 |
| `data-bf-theme-btn` | theme switcher buttons | theme name | — |
| `data-icon` | any element | `search`, `close`/`x`, `menu`, `check`, `chevron-down`, `chevron-right`, `plus`, `trash`, `star`, `heart`, `settings`/`gear`, `user` | 4.7 |
| `data-command` | `<dialog>`, `[popover]` | (boolean) | 4.7 |
| `data-command-list` | inside `[data-command]` | (boolean) | 4.7 |
| `data-command-item` | child of `[data-command-list]` | (boolean) | 4.7 |
| `data-command-hint` | inside `[data-command]` | (boolean) | 4.7 |
| `data-selected` | `[data-command-item]`, `tr` in `table[data-grid]` | (boolean) | 4.7 |
| `data-grid` | `<table>` (extends) | resizable columns via `resize: horizontal`, stacks at 40rem container | 4.7 |

Platform-gated styling carries no attribute of its own: single
`<select>`s pick up the `::picker(select)` skin only where the engine
supports `appearance: base-select` (`@supports`-gated, Chromium 135+);
everywhere else the chevron fallback applies.

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

# Barefoot CSS

> No boots, no baggage. A bare-bones, themeable, JS-free CSS framework built on modern CSS.

[![npm version](https://img.shields.io/npm/v/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![npm downloads](https://img.shields.io/npm/dm/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![CI](https://img.shields.io/github/actions/workflow/status/coffeetocoffee/barefoot-css/ci.yml)](https://github.com/coffeetocoffee/barefoot-css/actions)
[![MIT license](https://img.shields.io/npm/l/barefoot-css)](LICENSE)

Barefoot is a CSS framework for people who are tired of shipping 200KB of stylesheet to get a button. It styles **native HTML elements**, needs **zero JavaScript**, and re-skins from a **handful of variables**.

- **~10KB or bust.** `index.css` is 2.1KB gzipped. The *everything* bundle (`full.css` — every component, utility, and theme) is 8.6KB gzipped. Per-component entry points mean you only pay for what you import.
- **Theming by default.** Every visual is a `--bf-*` custom property. Re-skin by overriding six variables — no Sass, no recompile, no rebuild.
- **JS-free.** Dropdowns are Popover-API menus or `<details>`, modals are `<dialog>` (declarative with `command`/`commandfor`, otherwise one line of native JS), accordions are `<details name>`. Optional tiny JS modules add tabs, sortable tables, and menu keyboard nav — opt-in, zero deps.
- **Accessible out of the box.** Native elements ship focus traps, Esc-to-close, and ARIA semantics for free. Visible focus everywhere. AA contrast by default. Verified by an axe-core CI suite.
- **No "Bootstrap look."** Neutral by default: ink on paper, thin borders, no shadows, no gradients. The design is yours — we just supply the muscle.

## Quick start

```bash
npm install barefoot-css
```

```css
/* CSS */
@import "barefoot-css";                          /* reset + tokens + base */
@import "barefoot-css/components/dialog.css";    /* only what you need */
```

```html
<!-- HTML — plain elements, styled by Barefoot -->
<button>Save</button>
<input type="email" placeholder="you@example.com">
```

```css
/* Make it yours — six variables */
:root {
  --bf-primary: #2563eb;
  --bf-radius: 0.5rem;
  --bf-font: "Inter", system-ui, sans-serif;
}
```

## Size (measured, current build)

<!-- SIZES:START -->
| Artifact | Raw | Gzip | Brotli |
|---|---|---|---|
| `full.css` | 46.54KB | **8.66KB** | 7.59KB |
| `index.css` | 7.84KB | **2.18KB** | 1.87KB |
| `js/carousel.js` | 4.66KB | **1.92KB** | 1.63KB |
| `components/forms.css` | 8.39KB | **1.86KB** | 1.59KB |
| `js/popover-anchor.js` | 3.80KB | **1.60KB** | 1.34KB |
| `js/table-sort.js` | 3.28KB | **1.51KB** | 1.26KB |
| `js/nav.js` | 2.78KB | **1.29KB** | 1.07KB |
| `js/details-tabindex.js` | 2.61KB | **1.26KB** | 1.03KB |
| `js/tabs.js` | 2.51KB | **1.13KB** | 0.95KB |
| `js/popover-menu.js` | 2.25KB | **1.12KB** | 0.95KB |
| `js/roving-index.js` | 2.10KB | **1.04KB** | 0.89KB |
| `utilities.css` | 3.18KB | **0.86KB** | 0.65KB |
| `js/details-close.js` | 1.63KB | **0.84KB** | 0.69KB |
| `js/lifecycle.js` | 1.57KB | **0.82KB** | 0.67KB |
| `components/stepper.css` | 2.67KB | **0.70KB** | 0.56KB |
| `components/popover.css` | 2.74KB | **0.67KB** | 0.58KB |
| `components/buttons.css` | 2.02KB | **0.59KB** | 0.47KB |
| `components/table.css` | 1.44KB | **0.57KB** | 0.48KB |
| `components/nav.css` | 1.29KB | **0.50KB** | 0.40KB |
| `components/dropdown.css` | 1.23KB | **0.50KB** | 0.39KB |
| `components/carousel.css` | 1.19KB | **0.50KB** | 0.41KB |
| `components/dialog.css` | 1.13KB | **0.49KB** | 0.42KB |
| `components/accordion.css` | 1.44KB | **0.49KB** | 0.38KB |
| `js/remove-on-click.js` | 0.85KB | **0.48KB** | 0.39KB |
| `components/segmented.css` | 1.12KB | **0.46KB** | 0.34KB |
| `js/return-focus.js` | 0.65KB | **0.40KB** | 0.30KB |
| `js/chips.js` | 0.65KB | **0.40KB** | 0.31KB |
| `components/media.css` | 0.92KB | **0.39KB** | 0.31KB |
| `components/chip.css` | 0.81KB | **0.37KB** | 0.29KB |
| `js/alert-dismiss.js` | 0.61KB | **0.35KB** | 0.28KB |
| `components/tabs.css` | 0.78KB | **0.35KB** | 0.26KB |
| `components/timeline.css` | 0.84KB | **0.34KB** | 0.27KB |
| `components/badge.css` | 0.94KB | **0.34KB** | 0.26KB |
| `components/alert.css` | 0.85KB | **0.34KB** | 0.26KB |
| `themes/playful.css` | 0.59KB | **0.33KB** | 0.29KB |
| `components/pagination.css` | 0.75KB | **0.33KB** | 0.25KB |
| `themes/editorial.css` | 0.58KB | **0.32KB** | 0.27KB |
| `components/skeleton.css` | 0.52KB | **0.30KB** | 0.25KB |
| `components/empty-state.css` | 0.57KB | **0.30KB** | 0.24KB |
| `js/barefoot.js` | 0.56KB | **0.30KB** | 0.25KB |
| `components/spinner.css` | 0.61KB | **0.30KB** | 0.25KB |
| `components/grid.css` | 0.99KB | **0.28KB** | 0.22KB |
| `themes/forest.css` | 0.47KB | **0.27KB** | 0.23KB |
| `themes/dashboard.css` | 0.50KB | **0.26KB** | 0.22KB |
| `themes/sunset.css` | 0.44KB | **0.25KB** | 0.21KB |
| `components/breadcrumbs.css` | 0.51KB | **0.25KB** | 0.18KB |
| `themes/custom.css` | 0.45KB | **0.23KB** | 0.19KB |
| `components/code.css` | 0.40KB | **0.22KB** | 0.16KB |
| `components/divider.css` | 0.36KB | **0.22KB** | 0.16KB |
| `components/menu-items.css` | 0.36KB | **0.21KB** | 0.14KB |
| `components/card.css` | 0.33KB | **0.21KB** | 0.15KB |
| `components/reveal.css` | 0.32KB | **0.21KB** | 0.16KB |
| `components/view-transition.css` | 0.28KB | **0.16KB** | 0.14KB |
| `components/prose.css` | 0.30KB | **0.15KB** | 0.13KB |
<!-- SIZES:END -->

Budget: `index.css` must stay **under 10KB gzipped** — enforced by `npm run check`, which fails the build if exceeded.

Opt-in JS (`dist/js/`): nine zero-dependency behavior modules, imported
one by one or all together via `barefoot.js`. Internal plumbing
(`lifecycle.js`, `remove-on-click.js`) ships alongside but is not
public API. See [docs/javascript.md](docs/javascript.md).

## Browser baseline

Modern evergreen browsers only (2024+): Popover API, `light-dark()`, `@starting-style`, native CSS nesting, container queries. Barefoot deliberately does **not** transpile away modern CSS — that's where the size and simplicity come from.

## Project layout

```
src/
  index.css            core entry: layers, reset, tokens, base
  full.css             everything in one file
  layers.css           cascade layer order
  reset.css, tokens.css, base.css
  components/          buttons, forms, dialog, popover, dropdown,
                       accordion, tabs, carousel, grid, nav, alert,
                       skeleton, table, code, card, badge,
                       breadcrumbs, pagination
  js/                  opt-in modules: tabs, table-sort, popover-menu, nav, barefoot, …
  themes/              editorial, dashboard, playful, forest, sunset, custom template
  utilities.css        opt-in helpers
demo/index.html        conformance page (keyboard walkthroughs)
demo/gallery.html      theme gallery — every starter rendered live
docs/                  theming, components, javascript, accessibility,
                       performance, api
tests/                 a11y (axe-core), opt-in JS, visual regression
build/                 Lightning CSS bundler + size budget + preview server
```

## Docs

- Live: [docs site](https://coffeetocoffee.github.io/barefoot-css/) and
  [conformance demo](https://coffeetocoffee.github.io/barefoot-css/demo/) (GitHub Pages)
- [Theming](docs/theming.md) — tokens, `light-dark()`, `data-bf-theme`, starter themes
- [Components](docs/components.md) — markup, behavior, JS status for each component
- [JavaScript](docs/javascript.md) — the opt-in JS modules (tabs, Esc-close, popover menus)
- [Accessibility](docs/accessibility.md) — conformance stance and keyboard matrix
- [Performance](docs/performance.md) — size budgets, measurement, staying under them
- [Upgrading to v3](docs/migration-3.md) — the 2.x → 3.0 `fz` → `bf` rename map and codemod
- [Status](plan.md) — what's built, what's next
- [Plan](plan.md) — the original plan and the decisions made

## Development

```bash
npm install
npm run check     # build + enforce size budget
npm run preview   # serve demo/ at localhost:4173
```

## Testing & CI

`npm test` runs the full suite on Chromium — 140 tests, all passing
(one engine-gated skip):

- **Accessibility (`tests/a11y.spec.js`)** — axe-core conformance on the
  demo page in eight states (resting, dark, contrast, dialog-open,
  dropdown-open, toast-open, hamburger nav, invalid form), a
  per-component-section contrast sweep, and the theme gallery — all
  asserted at **zero violations** — plus keyboard-contract tests (focus
  rings, `<details>` toggle, popover Esc, dialog focus return, nav links
  + `aria-current`).
- **Opt-in JS (`tests/js.spec.js`)** — tabs (click, arrows, Home/End),
  the tabs no-JS-first contract (all panels visible without the module;
  marked + hidden with it), details Esc-close with focus return, the
  details tab-order shim (Tab reaches panel links in every engine),
  popover-menu keyboard nav.
- **CSS behavior (`tests/css.spec.js`)** — container-query grid columns,
  container-unit carousel slides, anchored popover placement, theme switch
  via `startViewTransition`, the v1.6 layout suite (spacing scale,
  grid `auto-fit`/`data-gap`, nav, sidebar, sticky), the v1.7 status
  suite (tokens, alerts, validation, skeleton, toasts, badges), live
  theme-gallery previews, the API reference audit pinning
  `docs/api.md` and the generated token tables to `src/`, and the
  3.1 platform primitives (scroll-driven carousel progress bar +
  reveal, hint tooltips, implicit anchors — engine-gated).
- **Visual regression (`tests/visual.spec.js`)** — full-page light/dark
  screenshots against committed per-engine baselines.

The JS + CSS behavior suites plus their own visual baselines also re-run
cross-engine — `npm run test:ff` (Firefox; 116 passing + 4
engine-gated skips) and `npm run test:webkit` (Safari's engine; 115
passing + 3 engine-gated skips).

```bash
npm test                          # all tests (Chromium)
npm run test:a11y                 # axe-core only
npm run test:ff                   # JS + CSS + visual on Firefox
npm run test:webkit               # JS + CSS + visual on WebKit/Safari
npm run test:visual               # compare against baselines
npm run test:visual:update        # regenerate baselines (deliberately!)
```

CI (`.github/workflows/ci.yml`, GitHub Actions) runs six jobs:
`build + size budget`, `behavior + a11y` (axe-core, JS, CSS) on
Linux/Chromium, behavior on **Firefox** (Linux) and **WebKit** (macOS),
and `visual regression` on Windows (bundled webfonts keep the baselines
machine-independent). The docs + demo also deploy to
[GitHub Pages](https://coffeetocoffee.github.io/barefoot-css/) on every
push to `main`.

## License

MIT

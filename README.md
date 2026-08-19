# Barefoot CSS

> No boots, no baggage. A bare-bones, themeable, JS-free CSS framework built on modern CSS.

[![npm version](https://img.shields.io/npm/v/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![npm downloads](https://img.shields.io/npm/dm/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![CI](https://img.shields.io/github/actions/workflow/status/coffeetocoffee/barefoot-css/ci.yml)](https://github.com/coffeetocoffee/barefoot-css/actions)
[![MIT license](https://img.shields.io/npm/l/barefoot-css)](LICENSE)

Barefoot is a CSS framework for people who are tired of shipping 200KB of stylesheet to get a button. It styles **native HTML elements**, needs **zero JavaScript**, and re-skins from a **handful of variables**.

- **~10KB or bust.** `index.css` is 1.6KB gzipped. The *entire* framework (all 16 components) is 5.2KB gzipped. Per-component entry points mean you only pay for what you import.
- **Theming by default.** Every visual is a `--fz-*` custom property. Re-skin by overriding six variables — no Sass, no recompile, no rebuild.
- **JS-free.** Dropdowns are `<details>`, modals are `<dialog>` (one line of native JS to open) or the Popover API (zero JS), accordions are `<details name>`. Optional tiny JS modules add tabs, Esc-close, and menu keyboard nav — opt-in, zero deps.
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
  --fz-primary: #2563eb;
  --fz-radius: 0.5rem;
  --fz-font: "Inter", system-ui, sans-serif;
}
```

## Size (measured, current build)

<!-- SIZES:START -->
| Artifact | Raw | Gzip | Brotli |
|---|---|---|---|
| `full.css` | 24.07KB | **5.21KB** | 4.62KB |
| `js/carousel.js` | 4.78KB | **1.92KB** | 1.63KB |
| `index.css` | 4.93KB | **1.57KB** | 1.35KB |
| `components/forms.css` | 5.92KB | **1.54KB** | 1.31KB |
| `js/tabs.js` | 2.70KB | **1.10KB** | 0.89KB |
| `js/popover-anchor.js` | 2.26KB | **1.04KB** | 0.84KB |
| `js/details-tabindex.js` | 1.86KB | **0.91KB** | 0.73KB |
| `js/popover-menu.js` | 2.17KB | **0.89KB** | 0.75KB |
| `components/buttons.css` | 2.06KB | **0.60KB** | 0.49KB |
| `components/dropdown.css` | 1.45KB | **0.54KB** | 0.42KB |
| `utilities.css` | 1.29KB | **0.53KB** | 0.42KB |
| `js/details-close.js` | 0.90KB | **0.51KB** | 0.39KB |
| `components/popover.css` | 1.25KB | **0.48KB** | 0.39KB |
| `components/dialog.css` | 1.05KB | **0.48KB** | 0.38KB |
| `components/accordion.css` | 1.34KB | **0.47KB** | 0.37KB |
| `components/table.css` | 0.87KB | **0.40KB** | 0.32KB |
| `components/tabs.css` | 0.73KB | **0.34KB** | 0.26KB |
| `components/pagination.css` | 0.75KB | **0.33KB** | 0.25KB |
| `themes/playful.css` | 0.58KB | **0.33KB** | 0.30KB |
| `themes/editorial.css` | 0.57KB | **0.32KB** | 0.27KB |
| `components/badge.css` | 0.52KB | **0.27KB** | 0.22KB |
| `themes/forest.css` | 0.47KB | **0.27KB** | 0.23KB |
| `themes/dashboard.css` | 0.49KB | **0.26KB** | 0.22KB |
| `components/carousel.css` | 0.44KB | **0.26KB** | 0.20KB |
| `components/breadcrumbs.css` | 0.51KB | **0.25KB** | 0.18KB |
| `js/barefoot.js` | 0.41KB | **0.24KB** | 0.20KB |
| `components/code.css` | 0.45KB | **0.24KB** | 0.18KB |
| `themes/custom.css` | 0.45KB | **0.23KB** | 0.19KB |
| `components/card.css` | 0.29KB | **0.20KB** | 0.14KB |
| `components/view-transition.css` | 0.28KB | **0.16KB** | 0.14KB |
| `components/grid.css` | 0.26KB | **0.16KB** | 0.11KB |
<!-- SIZES:END -->

Budget: `index.css` must stay **under 10KB gzipped** — enforced by `npm run check`, which fails the build if exceeded.

Opt-in JS (`dist/js/`, ~9KB total raw): `tabs.js`, `details-close.js`,
`details-tabindex.js`, `popover-menu.js`, `carousel.js`, plus `barefoot.js`
(all five). See [docs/javascript.md](docs/javascript.md).

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
                       accordion, tabs, carousel, table, code, card, badge
  js/                  opt-in modules: tabs, details-close, details-tabindex, popover-menu, barefoot
  themes/              editorial, dashboard, playful, custom template
  utilities.css        opt-in helpers
demo/index.html        conformance page (keyboard walkthroughs)
docs/                  theming, components, javascript, accessibility
tests/                 a11y (axe-core), opt-in JS, visual regression
build/                 Lightning CSS bundler + size budget + preview server
```

## Docs

- Live: [docs site](https://coffeetocoffee.github.io/barefoot-css/) and
  [conformance demo](https://coffeetocoffee.github.io/barefoot-css/demo/) (GitHub Pages)
- [Theming](docs/theming.md) — tokens, `light-dark()`, `data-theme`, starter themes
- [Components](docs/components.md) — markup, behavior, JS status for each component
- [JavaScript](docs/javascript.md) — the opt-in JS modules (tabs, Esc-close, popover menus)
- [Accessibility](docs/accessibility.md) — conformance stance and keyboard matrix
- [Status](status.md) — what's built, what's next
- [Plan](plan.md) — the original plan and the decisions made

## Development

```bash
npm install
npm run check     # build + enforce size budget
npm run preview   # serve demo/ at localhost:4173
```

## Testing & CI

`npm test` runs the full suite on Chromium — 47 tests, all passing:

- **Accessibility (`tests/a11y.spec.js`)** — axe-core conformance on the
  demo page in four states (resting, dark, dialog-open, dropdown-open),
  asserted at **zero violations**, plus keyboard-contract tests (focus
  rings, `<details>` toggle, popover Esc, dialog focus return).
- **Opt-in JS (`tests/js.spec.js`)** — tabs (click, arrows, Home/End),
  the tabs no-JS-first contract (all panels visible without the module;
  marked + hidden with it), details Esc-close with focus return, the
  details tab-order shim (Tab reaches panel links in every engine),
  popover-menu keyboard nav.
- **CSS behavior (`tests/css.spec.js`)** — container-query grid columns,
  container-unit carousel slides, anchored popover placement, theme switch
  via `startViewTransition`.
- **Visual regression (`tests/visual.spec.js`)** — full-page light/dark
  screenshots against committed baselines.

The JS + CSS behavior suites also re-run cross-engine — `npm run test:ff`
(Firefox) and `npm run test:webkit` (Safari's engine, 35 each, passing).

```bash
npm test                          # all tests (Chromium)
npm run test:a11y                 # axe-core only
npm run test:ff                   # JS + CSS behavior on Firefox
npm run test:webkit               # JS + CSS behavior on WebKit/Safari
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

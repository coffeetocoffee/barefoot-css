# Barefoot CSS

> **Kick off your boots.** A bare-bones, themeable, **JS-free** CSS framework for people who'd rather not ship 200KB of stylesheet to render a button.

[![npm version](https://img.shields.io/npm/v/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![npm downloads](https://img.shields.io/npm/dm/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![CI](https://img.shields.io/github/actions/workflow/status/coffeetocoffee/barefoot-css/ci.yml)](https://github.com/coffeetocoffee/barefoot-css/actions)
[![v5.0](https://img.shields.io/badge/phase-5.0%20%E2%80%94%20the%20component%20is%20the%20breakpoint-2b7a4f)](docs/adaptive.md)
[![MIT license](https://img.shields.io/npm/l/barefoot-css)](LICENSE)

---

## Why Barefoot?

- **~10KB or bust.** `index.css` is **2.88KB gzipped** (measured, not estimated — see the table below). Import the core plus only the component files you use; the *everything* bundle (`full.css`) has been frozen since v4.6 (ADR-0008) so per-component stays the real story.
- **The component is the breakpoint.** *(v5.0)* Components adapt to the **box they're dropped in**, not the viewport. Drop a data table into a sidebar and it card-stacks. Widen it and it returns to rows. No media queries, no JS, no re-render. → [docs/adaptive.md](docs/adaptive.md)
- **Theming by default.** Every visual is a `--bf-*` custom property. Re-skin with a handful of variables — no Sass, no recompile. Tokens also ship as a W3C DTCG `tokens.json` for Figma / iOS / Android sync, and v5.0 adds a **generative 12-step ramp** you steer with two dials (`--bf-seed-h` / `--bf-seed-c`).
- **JS-free, by default.** Dropdowns are Popover-API menus or `<details>`, modals are `<dialog>`, accordions are `<details name>`. Form validation is pure CSS (`:user-valid` / `:user-invalid`). Optional tiny JS modules (tabs, sortable tables, menu keyboard nav, theme persistence) are opt-in and zero-dependency.
- **Accessible out of the box.** Native elements hand you focus traps, Esc-to-close, and ARIA semantics for free. Visible focus everywhere, AA contrast by default, `forced-colors` hardened, and an axe-core suite in CI proves it.
- **No "Bootstrap look."** Neutral by default: ink on paper, hairline borders, no shadows, no gradients. The design is yours — we just supply the muscle.

---

## Quick start

```bash
npm install barefoot-css
```

```css
/* CSS — reset + tokens + base, then only what you need */
@import "barefoot-css";                          /* core: layers, reset, tokens, base */
@import "barefoot-css/components/dialog.css";     /* opt-in components, one import each */
```

```html
<!-- HTML — plain elements, styled by Barefoot -->
<button>Save</button>
<input type="email" placeholder="you@example.com">
```

```css
/* Make it yours — a handful of variables */
:root {
  --bf-primary: #2563eb;
  --bf-radius: 0.5rem;
  --bf-font: "Inter", system-ui, sans-serif;
}
```

---

## The v5.0 headline: *the component is the breakpoint*

Stop asking "how wide is the screen?" Start asking "how wide am I **here**?" A sidebar, a card, a grid cell — none of them *is* the viewport. v5.0's adaptive components sense their **container** and re-flow to fit:

| Component | Adaptive behavior |
|---|---|
| `table[data-table="adaptive"]` | Card-stacks when its container is narrow; stays a real `<table>` in the a11y tree. |
| `form[data-form="adaptive"]` | `.bf-row` collapses to one column; reveals a zero-JS error summary. |
| `.card[data-card="adaptive"]` | Horizontal ↔ vertical by container. |
| `[data-segmented][data-adaptive]` | Compresses label padding when narrow or under `data-density="compact"`. |

Every adaptive file is **opt-in** (never in frozen `full.css`). → [docs/adaptive.md](docs/adaptive.md)

---

## Size (measured, current build)

<!-- SIZES:START -->
| Artifact | Raw | Gzip | Brotli |
|---|---|---|---|
| `full.css` | 55.64KB | **10.37KB** | 9.06KB |
| `index.css` | 10.89KB | **2.88KB** | 2.46KB |
| `components/forms.css` | 10.79KB | **2.25KB** | 1.92KB |
| `js/carousel.js` | 4.66KB | **1.92KB** | 1.63KB |
| `js/table-sort.js` | 3.28KB | **1.51KB** | 1.26KB |
| `components/forms-base.css` | 5.49KB | **1.41KB** | 1.17KB |
| `js/theme.js` | 2.80KB | **1.31KB** | 1.06KB |
| `js/nav.js` | 2.78KB | **1.29KB** | 1.07KB |
| `js/popover-menu.js` | 2.46KB | **1.20KB** | 1.00KB |
| `js/tabs.js` | 2.51KB | **1.13KB** | 0.95KB |
| `js/roving-index.js` | 2.10KB | **1.04KB** | 0.89KB |
| `js/toast.js` | 2.75KB | **1.01KB** | 0.83KB |
| `utilities.css` | 3.18KB | **0.86KB** | 0.65KB |
| `js/lifecycle.js` | 1.57KB | **0.82KB** | 0.67KB |
| `components/icons.css` | 3.69KB | **0.80KB** | 0.65KB |
| `js/tooltip.js` | 1.86KB | **0.78KB** | 0.64KB |
| `components/stepper.css` | 2.67KB | **0.70KB** | 0.56KB |
| `components/popover.css` | 2.74KB | **0.67KB** | 0.58KB |
| `components/table.css` | 1.80KB | **0.64KB** | 0.54KB |
| `components/forms-select.css` | 1.66KB | **0.63KB** | 0.54KB |
| `components/reveal.css` | 2.11KB | **0.63KB** | 0.55KB |
| `components/buttons.css` | 2.10KB | **0.62KB** | 0.50KB |
| `components/command.css` | 2.05KB | **0.59KB** | 0.49KB |
| `components/nav.css` | 1.29KB | **0.50KB** | 0.40KB |
| `components/segmented.css` | 1.23KB | **0.50KB** | 0.37KB |
| `components/carousel.css` | 1.19KB | **0.50KB** | 0.41KB |
| `components/dialog.css` | 1.13KB | **0.49KB** | 0.42KB |
| `components/accordion.css` | 1.44KB | **0.49KB** | 0.38KB |
| `js/remove-on-click.js` | 0.85KB | **0.48KB** | 0.39KB |
| `js/reveal.js` | 0.88KB | **0.46KB** | 0.38KB |
| `components/layout.css` | 1.62KB | **0.44KB** | 0.37KB |
| `components/data-grid.css` | 0.98KB | **0.43KB** | 0.34KB |
| `components/skeleton.css` | 0.93KB | **0.41KB** | 0.33KB |
| `components/forms-checks.css` | 1.07KB | **0.41KB** | 0.31KB |
| `js/return-focus.js` | 0.65KB | **0.40KB** | 0.30KB |
| `js/chips.js` | 0.65KB | **0.40KB** | 0.31KB |
| `components/media.css` | 0.92KB | **0.39KB** | 0.31KB |
| `components/pagination.css` | 0.86KB | **0.38KB** | 0.28KB |
| `components/chip.css` | 0.81KB | **0.37KB** | 0.29KB |
| `components/table-adaptive.css` | 0.88KB | **0.36KB** | 0.28KB |
| `js/alert-dismiss.js` | 0.61KB | **0.35KB** | 0.28KB |
| `components/tabs.css` | 0.78KB | **0.35KB** | 0.26KB |
| `components/timeline.css` | 0.84KB | **0.34KB** | 0.27KB |
| `components/badge.css` | 0.94KB | **0.34KB** | 0.26KB |
| `components/alert.css` | 0.85KB | **0.34KB** | 0.26KB |
| `themes/playful.css` | 0.59KB | **0.33KB** | 0.29KB |
| `themes/editorial.css` | 0.58KB | **0.32KB** | 0.27KB |
| `components/grid.css` | 1.23KB | **0.31KB** | 0.25KB |
| `components/forms-range.css` | 0.91KB | **0.31KB** | 0.23KB |
| `js/barefoot.js` | 0.57KB | **0.30KB** | 0.25KB |
| `components/empty-state.css` | 0.57KB | **0.30KB** | 0.24KB |
| `components/spinner.css` | 0.61KB | **0.30KB** | 0.25KB |
| `components/form-adaptive.css` | 0.54KB | **0.29KB** | 0.23KB |
| `components/forms-file.css` | 0.60KB | **0.28KB** | 0.21KB |
| `components/forms-meter.css` | 0.74KB | **0.28KB** | 0.23KB |
| `themes/forest.css` | 0.47KB | **0.27KB** | 0.23KB |
| `themes/dashboard.css` | 0.50KB | **0.26KB** | 0.22KB |
| `themes/sunset.css` | 0.44KB | **0.25KB** | 0.21KB |
| `components/breadcrumbs.css` | 0.51KB | **0.25KB** | 0.18KB |
| `themes/coastal.css` | 0.44KB | **0.24KB** | 0.20KB |
| `components/card-adaptive.css` | 0.40KB | **0.24KB** | 0.18KB |
| `themes/custom.css` | 0.45KB | **0.23KB** | 0.19KB |
| `components/code.css` | 0.40KB | **0.22KB** | 0.16KB |
| `components/divider.css` | 0.36KB | **0.22KB** | 0.16KB |
| `components/view-transition.css` | 0.52KB | **0.22KB** | 0.18KB |
| `components/card.css` | 0.33KB | **0.21KB** | 0.15KB |
| `components/forms-color.css` | 0.42KB | **0.21KB** | 0.16KB |
| `components/menu-items.css` | 0.29KB | **0.20KB** | 0.13KB |
| `components/segmented-adaptive.css` | 0.44KB | **0.19KB** | 0.15KB |
| `themes/theming-anim.css` | 0.33KB | **0.18KB** | 0.14KB |
| `components/prose.css` | 0.30KB | **0.15KB** | 0.13KB |
<!-- SIZES:END -->

> **Budget:** `index.css` must stay **under 10KB gzipped** — enforced by `npm run check`, which fails the build if it ever creeps over.

Opt-in JS (`dist/js/`): nine zero-dependency behavior modules, imported one by one or all together via `barefoot.js`. Internal plumbing (`lifecycle.js`, `remove-on-click.js`) ships alongside but is not public API. → [docs/javascript.md](docs/javascript.md)

---

## Browser baseline (v5.0)

Modern evergreen browsers only — **Chrome 135+ / Firefox 151+ / Safari 26.2+** (ADR-0010). v5.0 leans on container queries, container *style* queries, container units, anchor positioning, the Invoker Commands API, and `oklch()` relative color. Barefoot deliberately does **not** transpile away modern CSS — that's exactly where the size and simplicity come from. Older engines gracefully degrade (e.g. an adaptive table stays a plain table).

---

## Project layout

```text
src/
  index.css            core entry: layers, reset, tokens, base
  full.css             everything in one file (frozen at 4.6, ADR-0008)
  layers.css           cascade layer order
  reset.css, tokens.css, base.css
  components/          buttons, forms, dialog, popover, dropdown,
                       accordion, tabs, carousel, grid, nav, alert,
                       skeleton, table, code, card, badge,
                       breadcrumbs, pagination — plus *-adaptive.css
  js/                  opt-in modules: tabs, table-sort, popover-menu, nav, barefoot, …
  themes/              editorial, dashboard, playful, forest, sunset, custom template
  utilities.css        opt-in helpers
demo/index.html        conformance page (keyboard walkthroughs)
demo/studio.html       generative theming editor (v5.0)
docs/                  theming, components, javascript, accessibility,
                       performance, api, adaptive, migration-3/4/5
tests/                 a11y (axe-core), opt-in JS, visual regression
build/                 Lightning CSS bundler + size budget + preview server
```

---

## Docs

- Live: [docs site](https://coffeetocoffee.github.io/barefoot-css/) and
  [conformance demo](https://coffeetocoffee.github.io/barefoot-css/demo/) (GitHub Pages)
- [Adaptive components](docs/adaptive.md) — *the* v5.0 feature: container-adaptive by contract
- [Theming](docs/theming.md) — tokens, `light-dark()`, `data-bf-theme`, starter themes, the generative ramp
- [Components](docs/components.md) — markup, behavior, JS status for each component
- [JavaScript](docs/javascript.md) — the opt-in JS modules (tabs, Esc-close, popover menus)
- [Accessibility](docs/accessibility.md) — conformance stance and keyboard matrix
- [Performance](docs/performance.md) — size budgets, measurement, staying under them
- [Upgrading to v4](docs/migration-4.md) · [Upgrading to v5](docs/migration-5.md)
- [Status & plan](plan.md) — what's built, what's next, and the decisions behind it

---

## Develop

```bash
npm install
npm run check     # build + enforce size budget + regenerate docs
npm run preview   # serve demo/ at localhost:4173
```

---

## Testing & CI

Hundreds of tests run across **Chromium, Firefox, and WebKit**:

- **Accessibility (`tests/a11y.spec.js`)** — axe-core conformance on the demo in eight states (resting, dark, contrast, dialog, popover, toast, hamburger nav, invalid form), a per-section contrast sweep, and the theme gallery — all at **zero violations** — plus keyboard-contract tests.
- **Opt-in JS (`tests/js.spec.js`)** — tabs (click, arrows, Home/End), no-JS-first contracts, popover-menu keyboard nav, theme persistence.
- **CSS behavior (`tests/css.spec.js`)** — container-query grids, anchored popovers, theme switching via `startViewTransition`, the adaptive-component suite (v5.0), the generative-theming suite (v5.0), and the API-reference audit pinning `docs/api.md` + generated token tables to `src/`.
- **Visual regression (`tests/visual.spec.js`)** — full-page light/dark screenshots against committed per-engine baselines.

```bash
npm test                          # all tests (Chromium)
npm run test:a11y                 # axe-core only
npm run test:ff                   # JS + CSS + visual on Firefox
npm run test:webkit               # JS + CSS + visual on WebKit/Safari
npm run test:visual              # compare against baselines
npm run test:visual:update       # regenerate baselines (deliberately!)
```

CI (`.github/workflows/ci.yml`) runs six jobs: `build + size budget`, behavior + a11y on Linux/Chromium, behavior on **Firefox** (Linux) and **WebKit** (macOS), and `visual regression` on Windows (bundled webfonts keep baselines machine-independent). Docs + demo deploy to [GitHub Pages](https://coffeetocoffee.github.io/barefoot-css/) on every push to `main`.

---

## License

MIT — go build something.

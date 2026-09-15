# Barefoot CSS

> **Kick off your boots.** A bare-bones, themeable, **JS-free** CSS framework for people who'd rather not ship 200KB of stylesheet to render a button.

[![npm version](https://img.shields.io/npm/v/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![npm downloads](https://img.shields.io/npm/dm/barefoot-css)](https://www.npmjs.com/package/barefoot-css)
[![CI](https://img.shields.io/github/actions/workflow/status/coffeetocoffee/barefoot-css/ci.yml)](https://github.com/coffeetocoffee/barefoot-css/actions)
[![MIT license](https://img.shields.io/npm/l/barefoot-css)](LICENSE)

Live demos: [conformance demo](https://coffeetocoffee.github.io/barefoot-css/demo/) · [layout playground](https://coffeetocoffee.github.io/barefoot-css/demo/playground.html) · [paint & paper](https://coffeetocoffee.github.io/barefoot-css/demo/paint-paper.html) · [data story](https://coffeetocoffee.github.io/barefoot-css/demo/data-story.html) · [theme studio](https://coffeetocoffee.github.io/barefoot-css/demo/studio.html)

---

## Why Barefoot?

- **Tiny.** Core (`index.css`) is ~3KB gzipped. Import only what you use — no 200KB bundle.
- **Container-aware, not viewport-aware.** Tables, forms, cards, and layouts adapt to the box they're in. No media queries, no JS. [Try the playground.](https://coffeetocoffee.github.io/barefoot-css/demo/playground.html)
- **Themeable in minutes.** Every visual is a `--bf-*` variable. No Sass, no rebuild. Tokens ship as W3C DTCG `tokens.json`.
- **JS-free by default.** Dialogs are `<dialog>`, accordions are `<details>`, menus are popovers. Opt-in zero-dependency JS only where CSS can't reach (tabs, sorting, theme persistence).
- **Accessible.** Native semantics, visible focus, AA contrast, `forced-colors` support, axe-core tested in CI.
- **Neutral.** Ink on paper, hairline borders, no shadows. Your design, not ours.

---

## Quick start

No build step. CDN first, npm second:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Barefoot test drive</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/barefoot-css@6/dist/index.css">
  <!-- opt-in: one <link> per component / theme -->
  <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/barefoot-css@6/dist/components/dialog.css"> -->
  <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/barefoot-css@6/dist/themes/sunset.css"> -->
</head>
<body>
  <button>Save</button>
  <input type="email" placeholder="you@example.com">
</body>
</html>
```

```bash
npm install barefoot-css
```

```css
@import "barefoot-css";                       /* core: layers, reset, tokens, base */
@import "barefoot-css/components/dialog.css"; /* opt-in components, one import each */

:root {
  --bf-primary: #2563eb;
  --bf-radius: 0.5rem;
  --bf-font: "Inter", system-ui, sans-serif;
}
```

---

## Features

| Area | What you get |
|---|---|
| Layout | `.bf-flow`, `.bf-switcher`, `.bf-sidebar` — container-aware primitives. Tight in a sidebar, roomy in a column. → [docs/layout.md](docs/layout.md) |
| Adaptive | Tables card-stack, forms reflow with a zero-JS error summary, cards flip orientation. Opt-in, never in `full.css`. → [docs/adaptive.md](docs/adaptive.md) |
| Forms & tables | Validation groups that tint on `:has(:user-invalid)`, sticky headers + leading column with a "more data" fade. → [docs/paint-paper.md](docs/paint-paper.md) |
| Data story | A density scale (`data-density`, one multiplier for padding and type), server-rendered sort (`data-sort`), and row selection with a zero-JS bulk-actions bar. → [docs/components.md](docs/components.md) |
| Print | Opt-in `print.css` flattens layouts, re-tabulates adaptive tables, prints link URLs. Zero cost on screen. |
| Verify | Opt-in dev checker audits Barefoot markup contracts in your console — what axe can't know. → [docs/verify.md](docs/verify.md) |

---

## Size

Measured from the current build, not estimated. Core stays **under 10KB gzipped** (enforced by `npm run check`).

<details>
<summary>Full per-file breakdown (raw / gzip / brotli)</summary>

<!-- SIZES:START -->
| Artifact | Raw | Gzip | Brotli |
|---|---|---|---|
| `full.css` | 56.59KB | **10.59KB** | 9.26KB |
| `js/verify-contracts.js` | 17.94KB | **5.68KB** | 4.87KB |
| `index.css` | 11.49KB | **3.05KB** | 2.61KB |
| `components/forms.css` | 10.79KB | **2.25KB** | 1.92KB |
| `js/carousel.js` | 4.66KB | **1.92KB** | 1.63KB |
| `js/verify.js` | 3.80KB | **1.75KB** | 1.50KB |
| `js/table-sort.js` | 3.48KB | **1.61KB** | 1.35KB |
| `js/theme.js` | 3.07KB | **1.42KB** | 1.15KB |
| `components/forms-base.css` | 5.49KB | **1.41KB** | 1.17KB |
| `js/lifecycle.js` | 2.95KB | **1.38KB** | 1.15KB |
| `js/nav.js` | 2.95KB | **1.37KB** | 1.14KB |
| `js/tabs.js` | 2.88KB | **1.28KB** | 1.08KB |
| `js/popover-menu.js` | 2.46KB | **1.20KB** | 1.00KB |
| `js/toast.js` | 2.96KB | **1.11KB** | 0.91KB |
| `js/roving-index.js` | 2.10KB | **1.04KB** | 0.89KB |
| `utilities.css` | 3.18KB | **0.86KB** | 0.65KB |
| `components/icons.css` | 3.69KB | **0.80KB** | 0.65KB |
| `components/states.css` | 2.78KB | **0.79KB** | 0.68KB |
| `js/tooltip.js` | 1.86KB | **0.78KB** | 0.64KB |
| `components/stepper.css` | 2.67KB | **0.70KB** | 0.56KB |
| `components/table.css` | 2.13KB | **0.69KB** | 0.58KB |
| `components/popover.css` | 2.74KB | **0.67KB** | 0.58KB |
| `js/remove-on-click.js` | 1.25KB | **0.66KB** | 0.54KB |
| `components/forms-select.css` | 1.66KB | **0.63KB** | 0.54KB |
| `components/reveal.css` | 2.11KB | **0.63KB** | 0.55KB |
| `components/buttons.css` | 2.10KB | **0.62KB** | 0.50KB |
| `components/print.css` | 1.83KB | **0.62KB** | 0.52KB |
| `components/command.css` | 2.05KB | **0.59KB** | 0.49KB |
| `components/nav.css` | 1.29KB | **0.50KB** | 0.40KB |
| `components/segmented.css` | 1.23KB | **0.50KB** | 0.37KB |
| `components/carousel.css` | 1.19KB | **0.50KB** | 0.41KB |
| `components/dialog.css` | 1.13KB | **0.49KB** | 0.42KB |
| `components/accordion.css` | 1.44KB | **0.49KB** | 0.38KB |
| `js/reveal.js` | 0.88KB | **0.46KB** | 0.38KB |
| `components/forms-validation.css` | 1.65KB | **0.45KB** | 0.36KB |
| `components/data-display.css` | 1.33KB | **0.45KB** | 0.36KB |
| `components/layout.css` | 1.62KB | **0.44KB** | 0.37KB |
| `components/data-grid.css` | 0.98KB | **0.43KB** | 0.34KB |
| `js/chips.js` | 0.72KB | **0.43KB** | 0.36KB |
| `components/skeleton.css` | 0.93KB | **0.41KB** | 0.33KB |
| `components/table-adaptive.css` | 0.99KB | **0.41KB** | 0.32KB |
| `themes/seed-system.css` | 1.48KB | **0.41KB** | 0.35KB |
| `components/forms-checks.css` | 1.07KB | **0.41KB** | 0.31KB |
| `js/return-focus.js` | 0.65KB | **0.40KB** | 0.30KB |
| `components/media.css` | 0.92KB | **0.39KB** | 0.31KB |
| `js/alert-dismiss.js` | 0.69KB | **0.39KB** | 0.32KB |
| `components/nav-adaptive.css` | 0.75KB | **0.38KB** | 0.29KB |
| `components/pagination.css` | 0.86KB | **0.38KB** | 0.28KB |
| `components/chip.css` | 0.81KB | **0.37KB** | 0.29KB |
| `components/table-select.css` | 0.69KB | **0.35KB** | 0.27KB |
| `components/tabs.css` | 0.78KB | **0.35KB** | 0.26KB |
| `components/timeline.css` | 0.84KB | **0.34KB** | 0.27KB |
| `components/layout-stagger.css` | 1.02KB | **0.34KB** | 0.29KB |
| `components/badge.css` | 0.94KB | **0.34KB** | 0.26KB |
| `components/alert.css` | 0.85KB | **0.34KB** | 0.26KB |
| `components/table-sticky.css` | 0.84KB | **0.34KB** | 0.28KB |
| `themes/playful.css` | 0.59KB | **0.33KB** | 0.29KB |
| `components/density.css` | 2.97KB | **0.32KB** | 0.26KB |
| `themes/editorial.css` | 0.58KB | **0.32KB** | 0.27KB |
| `themes/theming-scope.css` | 1.76KB | **0.32KB** | 0.26KB |
| `components/grid.css` | 1.23KB | **0.31KB** | 0.25KB |
| `components/forms-range.css` | 0.91KB | **0.31KB** | 0.23KB |
| `js/barefoot.js` | 0.57KB | **0.30KB** | 0.25KB |
| `components/empty-state.css` | 0.57KB | **0.30KB** | 0.24KB |
| `components/spinner.css` | 0.61KB | **0.30KB** | 0.25KB |
| `components/form-adaptive.css` | 0.54KB | **0.29KB** | 0.23KB |
| `components/card-adaptive.css` | 0.50KB | **0.28KB** | 0.23KB |
| `components/forms-file.css` | 0.60KB | **0.28KB** | 0.21KB |
| `components/forms-meter.css` | 0.74KB | **0.28KB** | 0.23KB |
| `components/layout-rhythm.css` | 0.61KB | **0.28KB** | 0.21KB |
| `themes/forest.css` | 0.47KB | **0.27KB** | 0.23KB |
| `themes/dashboard.css` | 0.50KB | **0.26KB** | 0.22KB |
| `themes/sunset.css` | 0.44KB | **0.25KB** | 0.21KB |
| `components/breadcrumbs.css` | 0.51KB | **0.25KB** | 0.18KB |
| `components/forms-state.css` | 0.48KB | **0.25KB** | 0.17KB |
| `themes/coastal.css` | 0.44KB | **0.24KB** | 0.20KB |
| `themes/custom.css` | 0.45KB | **0.23KB** | 0.19KB |
| `components/code.css` | 0.40KB | **0.22KB** | 0.16KB |
| `components/divider.css` | 0.36KB | **0.22KB** | 0.16KB |
| `components/layout-flow.css` | 0.34KB | **0.22KB** | 0.17KB |
| `components/view-transition.css` | 0.52KB | **0.22KB** | 0.18KB |
| `components/card.css` | 0.33KB | **0.21KB** | 0.15KB |
| `components/forms-color.css` | 0.42KB | **0.21KB** | 0.16KB |
| `components/menu-items.css` | 0.29KB | **0.20KB** | 0.13KB |
| `components/tabs-adaptive.css` | 0.38KB | **0.19KB** | 0.16KB |
| `components/segmented-adaptive.css` | 0.44KB | **0.19KB** | 0.15KB |
| `components/layout-switcher.css` | 0.27KB | **0.19KB** | 0.15KB |
| `themes/theming-anim.css` | 0.33KB | **0.18KB** | 0.14KB |
| `components/prose.css` | 0.32KB | **0.17KB** | 0.13KB |
| `components/script-type.css` | 0.25KB | **0.14KB** | 0.10KB |
| `components/layout-sidebar.css` | 0.16KB | **0.13KB** | 0.11KB |
<!-- SIZES:END -->

</details>

Opt-in JS (`dist/js/`): zero-dependency modules, imported individually or via `barefoot.js`. `verify.js` is dev-only and never in the barrel. → [docs/javascript.md](docs/javascript.md)

---

## Browser support

Evergreen only — Chrome 135+, Firefox 151+, Safari 26.2+. No transpiling of modern CSS (container queries, anchor positioning, `oklch()`). Older engines gracefully degrade to plain layouts.

---

## Project layout

```text
src/        index.css (core), components/, themes/, js/ (opt-in)
demo/       conformance demo + playground + paint-paper + studio
docs/       theming, components, layout, adaptive, accessibility, …
tests/      a11y (axe), JS, CSS behavior, visual regression
build/      bundler + size budget + preview server
```

`full.css` is frozen since v4.6 — new surfaces ship as separate opt-in files.

---

## Docs

| Guide | Covers |
|---|---|
| [Theming](docs/theming.md) | Tokens, `light-dark()`, `data-bf-theme`, starter themes |
| [Components](docs/components.md) | Markup, behavior, JS status |
| [JavaScript](docs/javascript.md) | Opt-in modules + the `bf:*` event contract |
| [States](docs/states.md) | State machine, empty states, validation summaries |
| [Adaptive](docs/adaptive.md) / [Layout](docs/layout.md) | Container-aware components & primitives |
| [Paint & paper](docs/paint-paper.md) | Validation, sticky tables, print |
| [Accessibility](docs/accessibility.md) / [Performance](docs/performance.md) | Conformance, budgets |
| [Migration](docs/migration-4.md) | v4 · [v5](docs/migration-5.md) · [v3](docs/migration-3.md) |
| [Status & plan](plan.md) | What's built, what's next |

---

## Develop

```bash
npm install
npm run check     # build + size budget + docs + lint
npm run preview   # serve demo/ at localhost:4173
```

## Testing

Chromium by default; Firefox / WebKit / axe / visual via flags:

```bash
npm test                 # all suites (Chromium)
npm run test:a11y        # axe-core only
npm run test:ff          # Firefox
npm run test:webkit      # WebKit
npm run test:visual:update  # regenerate baselines (deliberate only)
```

CI runs build + a11y + behavior (Chromium, Firefox, WebKit) + visual regression. Docs + demo deploy to GitHub Pages on every push to `main`.

---

## License

MIT — go build something. Shoes optional.

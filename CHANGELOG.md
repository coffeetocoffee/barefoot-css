# Changelog

All notable changes to Barefoot CSS are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] — 2026-08-19

The app shell: full spacing scale, auto-flowing grid variants, site
navigation, and split/sticky layout — everything a real app needs to put
Barefoot's components on a page. All CSS-only, no new JS.

### Added

- **Full spacing scale** (`utilities.css`) — `.fz-mt-1…8` /
  `.fz-mb-1…8` (margin-block-start/end), `.fz-p-1…8` (all-sides
  padding), `.fz-px-1…8` / `.fz-py-1…8` (padding-inline/block), each
  mapped to the matching `--fz-space-*` token. Axis shorthands win over
  `.fz-p-*` when both are applied.
- **Grid variants** (`components/grid.css`) — `[data-grid="auto-fit"]`
  and `[data-grid="auto-fill"]` flow as many columns as fit (each ≥
  `--fz-grid-min`, 14rem) without a container query, and
  `data-gap="0|1…8"` tunes the gap from the spacing scale. The fixed
  container-query counts no longer override the variants.
- **Navigation** (`components/nav.css`) — `[data-nav]` topbar row with
  an optional `.fz-brand` and a link list (`data-nav="header"` /
  `"footer"` variants, hairline separators); `aria-current="page"`
  marks the active link (accent + semibold). Wraps on narrow screens —
  nothing toggles, nothing hides.
- **Split layout** (`utilities.css`) — `.fz-sidebar`: the first child is
  the aside (`--fz-sidebar-width`, 16rem), the rest flows beside it, and
  the split stacks to one column when the row can't fit the aside plus
  ≥60% main. Zero media queries.
- **Sticky utility** (`utilities.css`) — `.fz-sticky` pins an element to
  `--fz-sticky-top` (`0`) while its scrolling ancestor moves.
- **New tokens** (`tokens.css`) — `--fz-grid-min`, `--fz-grid-gap`,
  `--fz-sidebar-width`, `--fz-sticky-top`.

### Tests

- +7 CSS behavior tests (spacing scale + axis-shorthand precedence,
  grid `auto-fit` track count/width, `data-gap`, nav current-page +
  pills, nav footer variant, sidebar split + narrow stack, sticky) and
  +1 a11y keyboard test (nav links focusable in order, `aria-current`
  carried). Chromium 55 / Firefox 42 / WebKit 42 suites green; axe-core
  still zero violations; visual baselines regenerated for the expanded
  demo.

## [1.5.0] — 2026-08-19

The form is finished: `<select>` gets a themed chevron, `file` and `color`
inputs get a skin, textareas can auto-grow, required fields announce
themselves visually, and the whole form signals invalid state. Plus base
typography polish, a skip-link utility, and animated accordion disclosure.

### Added

- **`<select>` skin** (`components/forms.css`) — `appearance: none` + a
  themed chevron (a `currentColor` SVG arrow) replaces the raw OS arrow;
  the dropdown list stays native. `[multiple]` / `[size]` selects keep
  the browser's control.
- **`input[type="file"]`** — the button is skinned via
  `::file-selector-button` with the button tokens; it stays a native
  file input.
- **`input[type="color"]`** — a themed swatch sized to the control
  height, with a focus ring from the shared input rule.
- **Required marker** — a label that *wraps* a required control gets a
  danger asterisk (`label:has(> input[required])::after`); screen
  readers already announce the `required` attribute.
- **Auto-grow textarea** — opt-in `[data-autogrow]` sets
  `field-sizing: content` (progressive enhancement; the fixed rows /
  `min-height` hold where unsupported).
- **Form-level invalid signal** — `form:has(:user-invalid)` draws a
  subtle ring around the whole form once any touched field is invalid.
- **`<output>`** styled as a live-region value (semibold, text color).
- **Base polish** (`src/base.css`) — `mark` (accent tint via
  `color-mix`), `figure`/`figcaption`, `address` (no italics),
  `del`/`ins` (kept inline, tinted). `kbd`/`samp` already shipped in
  `components/code.css`.
- **Skip-link utility** (`utilities.css`) — `.fz-skip-link`, first
  element in `<body>`; clipped out of view until keyboard focus, then
  revealed top-left (WCAG 2.4.1 bypass-block pattern).
- **Accordion open/close motion** (`components/accordion.css`) — the
  panel height animates `0` ↔ `auto` via
  `interpolate-size: allow-keywords` where supported; engines without it
  keep the instant toggle. `prefers-reduced-motion` collapses it
  globally.

### Tests

- +7 CSS behavior tests (select chevron, file-button skin, color swatch,
  required asterisk, autogrow, `form:has(:user-invalid)`, output), +1
  a11y keyboard test (skip link hidden until focus).
- Chromium 47 / Firefox 35 / WebKit 35 suites green; axe-core still zero
  violations across all states; visual baselines regenerated for the
  expanded demo form.

## [1.4.0] — 2026-08-19

Form controls get a real skin, breadcrumbs and pagination ship, a fourth
starter theme joins, OS accessibility settings are honored, and the
carousel grows opt-in autoplay + prev/next controls. Plus a stylelint
pass and an auto-generated README size table.

### Added

- **Form control skins** (`components/forms.css`) — a custom range-slider
  skin (WebKit + Gecko pseudo-elements, focus-visible ring) and themed
  `<progress>` / `<meter>` bars that match the accent instead of the raw
  browser default.
- **Breadcrumbs** (`components/breadcrumbs.css`) — `[data-breadcrumbs]`
  nav: slash separators, `aria-current="page"` muted.
- **Pagination** (`components/pagination.css`) — `[data-pagination]` nav:
  the current page is a filled `<span aria-current="page">`, never a link.
- **Forest theme** (`themes/forest.css`) — a fourth starter theme: deep
  greens on warm paper.
- **Tooltip trigger affordance** (`components/popover.css`) — `[data-tooltip]`
  gets a dotted underline + `cursor: help`, pairing with
  `[popover][data-kind="tooltip"]`.
- **`js/carousel.js`** (opt-in, ~4.8KB, zero deps) — autoplay
  (`data-autoplay="ms"`, 3000ms default, 1000ms floor, pauses on hover /
  focus / hidden tab, never starts under reduced motion) and
  `data-carousel-prev` / `data-carousel-next` buttons (also work without
  autoplay). Marks the scroller `role="group"` +
  `aria-roledescription="carousel"` only when the author hasn't already.
  Wired into the all-in-one `js/barefoot.js` import.
- **OS accessibility settings** (`src/tokens.css`) — `@media
  (prefers-contrast: more)` forces black-on-white tokens; `@media
  (prefers-reduced-transparency: reduce)` drops shadows. An explicit
  `data-theme` still wins over both.
- **stylelint** — `.stylelintrc.json` tuned to the codebase's deliberate
  style + `npm run lint:css`; the source is lint-clean.
- **Auto-generated README size table** — `build/readme-size.mjs` +
  `npm run docs:size` regenerate the size table between
  `<!-- SIZES:START -->` markers from `dist/sizes.json`.

### Changed

- `npm run check` now also runs `docs:size` and `lint:css`.
- Range/progress/meter drop `accent-color` for the full skin; text inputs,
  checkboxes, and radios keep the native themed `accent-color`.

### Fixed

- Carousel `step()` snap math: prev/next move exactly one slide and wrap
  in every engine (the centered-snap offset — 60cqi slides — is cancelled
  by computing snap positions from each slide's `offsetLeft`, instead of
  raw `scrollLeft` arithmetic).

### Tests

- +10 behavior tests (6 CSS, 4 JS): range/progress/meter skins,
  breadcrumbs, pagination, forest theme, prefers-contrast; carousel
  role/roledescription marking, prev/next wrap, autoplay (asserts the
  contract — it initiates a forward scroll — because headless Firefox
  doesn't run smooth-scroll animations), autoplay-off under reduced motion.
- Chromium 39 / Firefox 28 / WebKit 28 suites green; visual baselines
  regenerated for the expanded demo.

## [1.3.1] — 2026-08-18

Fix for the one remaining known gap: anchored popovers with an off-screen
trigger.

### Fixed

- **Anchored popover off-screen guard** (`js/popover-anchor.js`, opt-in,
  ~2.3KB, zero deps) — when a script opens an anchored popover whose
  trigger is **fully outside the viewport**, the popover is closed
  immediately. This resolves the Firefox behavior where such a popover is
  clamped to the viewport edge (visible at the wrong place): Firefox 153
  clamps, Chromium/WebKit pin it to the off-screen trigger — no engine
  honors `position-visibility: anchors-visible` yet, so nothing hides it.
  The guard matches that spec intent. A trigger **in view** is untouched:
  click-to-open and programmatic opens behave exactly as native.
- Wired into the all-in-one `js/barefoot.js` import.
- Regression tests run in every engine (Chromium 29 / Firefox 18 /
  WebKit 18 total suites): script-open with the trigger off-screen closes
  the popover; a trigger in view still opens normally.

## [1.3.0] — 2026-08-18

Safari/WebKit tab-order shim for `details` panels, anchor-positioning
robustness (viewport-edge flip), and a fail-fast release workflow.

> **Note:** the shim work was originally scoped as "1.2.0", but it was
> never published under its own version (no `v1.2.0` tag, no
> `barefoot-css@1.2.0` on npm). It shipped in this release instead.

### Added

- **`js/details-tabindex.js`** (opt-in, <1KB, zero deps) — WebKit/Safari
  skips the contents of an *open* `<details>` in the sequential tab order
  (items stay clickable, but Tab never reaches them). The shim walks the
  panel of every open `details` and gives its focusable descendants an
  explicit `tabindex="0"` (preserving deliberate `tabindex="-1"`). Watches
  the `open` attribute via a `MutationObserver` — a `<details>` can flip
  via click, keyboard, or script, and Chromium doesn't fire the `toggle`
  event on a summary click — plus a pass at init for panels already open.
- Wired into the all-in-one `js/barefoot.js` import.
- **`position-try-fallbacks: flip-block`** on anchored menus and tooltips —
  when the trigger sits near a viewport edge, the popover flips to the
  opposite side instead of spilling off-screen (menu below a button at the
  bottom of the screen flips above it). The preferred `position-area` is
  tried first; the fallback only kicks in when it would overflow.

### Fixed

- WebKit: links, buttons, and inputs inside open `<details>` panels are now
  reachable by keyboard. The existing Esc-close test's WebKit workaround
  was removed — the real Tab contract now runs in every engine.

### CI / engineering

- **Release preflight** — the publish workflow now runs `npm whoami`
  before the long build+test run, so a missing/invalid `NPM_TOKEN` fails
  in seconds with a clear signal. The workflow header documents the
  requirement in plain words: the token must be a **granular access token
  with "Publish to the public registry" and "bypass 2FA" enabled** (npm
  otherwise rejects automated publishes with `E403`).

### Notes

- The **Firefox off-screen-trigger clamp** remains an upstream browser bug
  (popover clamps to the viewport edge when its trigger is off-screen at
  open time). Verified still present in Firefox 153 on 2026-08-18; the
  spec-default `position-visibility: anchors-visible` does not mitigate it
  in any engine (both compute it as default yet neither hides the popover).
  The flip fallback is the adjacent, shipable improvement; the bug itself
  is tracked in status.md.

## [1.1.0] — 2026-08-12

Tight follow-up release: switch component, stackable tables, print
support, and packaging insurance.

### Added

- **Switch** — `input[type="checkbox"][data-switch]` (CSS-only toggle:
  track + thumb drawn with background layers on the element, so it
  stays a native checkbox — keyboard-focusable, screen-reader-
  announced, theme-aware; supports `:checked` and `:indeterminate`).
- **Stackable tables** — `table[data-table="stack"]` stacks rows as
  cards when the nearest query container is <40rem (wrap in
  `.fz-contain`; a `<table>` element itself can't be a size container).
  The `<th>` headers stay in the DOM, so screen readers still announce
  them.
- **Print stylesheet** — `@media print` in the base layer: flat colors,
  no decorative depth, and `break-inside: avoid` on tables/cards.
- `scrollbar-gutter: stable` on `<html>` so content doesn't jump when
  a scrollbar appears or disappears.

### CI / engineering

- **Fresh-install packaging smoke test** — CI packs the tarball, installs
  it into a throwaway consumer project, and resolves every public export
  (`barefoot-css`, `full.css`, components, themes, `js/*`, `src/*`) to a
  real file. Catches packaging bugs before they reach npm.

### Notes

- Checkbox/radio skins remain the native `accent-color` look: already
  theme-aware and zero-risk. Custom skins add cross-browser risk for
  no reliability gain, so they were cut from this release.

## [1.0.0] — 2026-08-12

First public release to npm as **`barefoot-css`** (the bare name `barefoot`
was taken on npm by an unrelated project).

### Added

- Core: cascade-layer architecture (`@layer reset, tokens, base, components,
  utilities`), custom reset, `--fz-*` token system with `light-dark()`
  pairs and `@property`-registered variables.
- Theme presets `auto` / `light` / `dark` / `contrast` via `data-theme`;
  starter themes `editorial`, `dashboard`, `playful` + `custom` template.
- 14 components (buttons, forms, dialog, popover, dropdown, accordion,
  carousel, table, code, card, badge, tabs, grid, view-transition).
- Container-query `[data-grid]` responsive variants and container-unit
  (`60cqi`) carousel slides.
- Anchored popovers (`position-area`) and `view-transition` theme crossfades.
- Opt-in JS modules (zero deps): WAI-ARIA tabs (`js/tabs.js`), reliable
  Esc-close for `details[data-menu]` (`js/details-close.js`), popover-menu
  keyboard nav (`js/popover-menu.js`), all three in `js/barefoot.js`.
- Docs site and conformance demo, deployed to GitHub Pages.

### Fixed

- Dark-mode button hover contrast (1.25:1 → passing) surfaced by the
  axe-core suite; demo `<main>` landmark and `role="group"` form issues.
- Serve bug: no directory→`index.html` mapping made `/demo/` 404.
- Dialog entrance fallback for engines without `transition-behavior: allow-discrete`.

### CI / engineering

- Playwright + `@axe-core/playwright` suite: zero axe violations across
  four page states; keyboard-contract tests; cross-engine behavior runs
  (Chromium, Firefox, WebKit); visual regression with committed baselines.
- Bundled demo webfonts (Inter + JetBrains Mono, OFL) so visual baselines
  are machine-independent.
- Size budget: `index.css` 1.28KB gzipped (limit 10KB), enforced in the
  build and a standalone `npm run size` check.
- Release workflow: tag `v*` → build + budget + tests → `npm publish`
  → GitHub Release.

[1.6.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.6.0
[1.5.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.5.0
[1.3.1]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.1
[1.3.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.3.0
[1.1.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.1.0
[1.0.0]: https://github.com/coffeetocoffee/barefoot-css/releases/tag/v1.0.0
